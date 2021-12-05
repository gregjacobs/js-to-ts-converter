import {
	Project,
	CallExpression,
	ClassDeclaration,
	ConstructorDeclaration,
	SetAccessorDeclaration,
	GetAccessorDeclaration,
	MethodDeclaration,
	FunctionDeclaration,
	NewExpression,
	Node,
	SourceFile,
	SyntaxKind,
	JSDocParameterTag,
	JSDoc,
	JSDocTypeTag,
	ParameterDeclaration,
	BindingElement,
} from "ts-morph";
import logger from "../logger/logger";
import { jsDocElement } from "./jsDocElement";
import { parameterElement } from "./parameterElement";
import { parameterFix } from "./parameterFix";

type NameableFunction = ConstructorDeclaration | SetAccessorDeclaration | GetAccessorDeclaration | MethodDeclaration | FunctionDeclaration;
type FunctionTransformTarget = NameableFunction | ConstructorDeclaration;

const parameterFixes: parameterFix[] = [];

/**
 * Adds the question token to function/method/constructor parameters that are
 * deemed to be optional based on the calls to that function/method/constructor
 * in the codebase.
 *
 * For example, if we have:
 *
 *     function myFn( arg1, arg2, arg3 ) {
 *         // ...
 *     }
 *
 *     myFn( 1, 2, 3 );  // all 3 args provided
 *     myFn( 1, 2 );     // <-- a call site only provides two arguments
 *
 * Then the resulting TypeScript function will be:
 *
 *     function myFn( arg1, arg2, arg3? ) {   // <-- arg3 marked as optional
 *         // ...
 *     }
 *
 * Note: Just calling the language service to look up references takes a lot of
 * time. Might have to optimize this somehow in the future.
 */
export function addOptionalsToFunctionParams(tsAstProject: Project): Project {
	logger.verbose("Beginning routine to mark function parameters as optional when calls exist that supply fewer args than parameters...");
	const sourceFiles = tsAstProject.getSourceFiles();

	logger.verbose("Parsing function/method/constructor calls from codebase.");
	const constructorMinArgsMap = parseClassConstructorCalls(sourceFiles);
	const functionsMinArgsMap = parseFunctionAndMethodCalls(sourceFiles);

	logger.verbose("Marking parameters as optional");
	addOptionals(constructorMinArgsMap);
	addOptionals(functionsMinArgsMap);

	//sourceFiles[0].insertText(110, ": { p1?: string | undefined; p2?: number | undefined; p3?: { p21: string; p22: { p31: string } } | undefined }");
	parameterFix.insert(parameterFixes);

	return tsAstProject;
}

/**
 * Finds the call sites of each ClassDeclaration's constructor in order to
 * determine if any of its parameters should be marked as optional.
 *
 * Returns a Map keyed by ClassDeclaration which contains the minimum number of
 * arguments passed to that class's constructor.
 *
 * Actually marking the parameters as optional is done in a separate phase.
 */
function parseClassConstructorCalls(sourceFiles: SourceFile[]): Map<ConstructorDeclaration, number> {
	logger.verbose("Finding all calls to class constructors...");
	const constructorMinArgsMap = new Map<ConstructorDeclaration, number>();

	sourceFiles.forEach((sourceFile: SourceFile) => {
		logger.verbose(`  Processing classes in source file: ${sourceFile.getFilePath()}`);
		const classes = sourceFile.getDescendantsOfKind(SyntaxKind.ClassDeclaration);

		classes.forEach((classDeclaration: ClassDeclaration) => {
			const constructorFns = classDeclaration.getConstructors() || [];
			const constructorFn = constructorFns.length > 0 ? constructorFns[0] : undefined; // only grab the first since we're converting JavaScript

			// If there is no constructor function for this class, then nothing to do
			if (!constructorFn) {
				return;
			}

			logger.verbose(`    Looking for calls to the constructor of class: '${classDeclaration.getName()}'`);

			const constructorFnParams = constructorFn.getParameters();
			const numParams = constructorFnParams.length;

			const referencedNodes = classDeclaration.findReferencesAsNodes();

			const callsToConstructor = referencedNodes.map((node: Node) => node.getFirstAncestorByKind(SyntaxKind.NewExpression)).filter((node): node is NewExpression => !!node);

			logger.debug(`    Found ${callsToConstructor.length} call(s) to the constructor`);

			const minNumberOfCallArgs = callsToConstructor.reduce((minCallArgs: number, call: NewExpression) => {
				return Math.min(minCallArgs, call.getArguments().length);
			}, numParams);

			if (callsToConstructor.length > 0) {
				logger.debug(`    Constructor currently expects ${numParams} params. Call(s) to the constructor supply a minimum of ${minNumberOfCallArgs} args.`);
			}

			constructorMinArgsMap.set(constructorFn, minNumberOfCallArgs);
		});
	});

	return constructorMinArgsMap;
}

/**
 * Finds the call sites of each FunctionDeclaration or MethodDeclaration in
 * order to determine if any of its parameters should be marked as optional.
 *
 * Returns a Map keyed by FunctionDeclaration or MethodDeclaration which contains
 * the minimum number of arguments passed to that function/method.
 *
 * Actually marking the parameters as optional is done in a separate phase.
 */
function parseFunctionAndMethodCalls(sourceFiles: SourceFile[]): Map<NameableFunction, number> {
	logger.verbose("Finding all calls to functions/methods...");
	const functionsMinArgsMap = new Map<NameableFunction, number>();

	sourceFiles.forEach((sourceFile: SourceFile) => {
		logger.verbose(`  Processing functions/methods in source file: ${sourceFile.getFilePath()}`);
		const fns = getFunctionsAndMethods(sourceFile);
		const jsDocElements: jsDocElement[] | undefined = getJsDocElements(fns);
		const parameterElements: parameterElement[] = [];

		fns.forEach((fn: NameableFunction) => {
			const fnName = fn instanceof ConstructorDeclaration ? "constructor" : fn.getName();

			logger.verbose(`    Looking for calls to the function: '${fnName}'`);

			const fnParams = fn.getParameters();
			const numParams = fnParams.length;
			const referencedNodes = fn.findReferencesAsNodes();
			const callsToFunction = referencedNodes.map((node: Node) => node.getFirstAncestorByKind(SyntaxKind.CallExpression)).filter((node): node is CallExpression => !!node);
			const returnTypeJsDocElement = fn instanceof GetAccessorDeclaration ? getGetAccessorReturnType(fnName, jsDocElements) : fn instanceof SetAccessorDeclaration ? undefined : getReturnType(fnName, jsDocElements);

			fnParams.forEach((param: ParameterDeclaration) => {
				// Is it Destructuring assignment and setting function parameters default value - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
				const type = param.getType();
				const bindingElements = param.getDescendantsOfKind(SyntaxKind.BindingElement);
				const paramType = type.getText();
				let paramName = param.getName();

				// Which parameter is it?
				//   function smartFunctionParameters(value, { p1 = "P1", p2 = 100, p3 = { p21: "P21", p22: { p31: "P31" } } } = {}) {}
				if (bindingElements.length == 0) {
					// Regular parameter: value
					if (fn instanceof SetAccessorDeclaration || fn instanceof GetAccessorDeclaration) {
						paramName = "type";
					}

					// Set Parameter types from JSDoc
					const jsDocElement = getMethodParameterType(fnName, paramName, jsDocElements);

					if (jsDocElement?.isParamTypeOptional) {
						param.setHasQuestionToken(true);
					}

					if (jsDocElement?.paramType) {
						param.setType(jsDocElement?.paramType);
					} else {
						param.setType(paramType);
					}
				} else {
					// Smart function parameters - https://javascript.info/destructuring-assignment#smart-function-parameters
					//   { p1 = "P1", p2 = 100, p3 = { p21: "P21", p22: { p31: "P31" } } }
					// TODO: make walkParameterTree() work

					// Save parameter fix to be applied at the end
					parameterFixes.push(new parameterFix(sourceFile, param, type.getText()));
				}
			});

			// Set method return type from JSDoc
			if (returnTypeJsDocElement && returnTypeJsDocElement.returnType) {
				fn.setReturnType(returnTypeJsDocElement.returnType);
			}

			logger.debug(`    Found ${callsToFunction.length} call(s) to the function '${fnName}'`);

			const minNumberOfCallArgs = callsToFunction.reduce((minCallArgs: number, call: CallExpression) => {
				return Math.min(minCallArgs, call.getArguments().length);
			}, numParams);

			if (callsToFunction.length > 0) {
				logger.debug(`    Function currently expects ${numParams} params. Call(s) to the function/method supply a minimum of ${minNumberOfCallArgs} args.`);
			}

			functionsMinArgsMap.set(fn, minNumberOfCallArgs);
		});
	});

	return functionsMinArgsMap;
}

/**
 * Retrieves all FunctionDeclarations and MethodDeclarations from the given
 * source file.
 */
function getFunctionsAndMethods(sourceFile: SourceFile): NameableFunction[] {
	return ([] as NameableFunction[]).concat(
		sourceFile.getDescendantsOfKind(SyntaxKind.Constructor),
		sourceFile.getDescendantsOfKind(SyntaxKind.SetAccessor),
		sourceFile.getDescendantsOfKind(SyntaxKind.GetAccessor),
		sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration),
		sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration)
	);
}

/**
 * Marks parameters of class constructors / methods / functions as optional
 * based on the minimum number of arguments passed in at its call sites.
 *
 * Ex:
 *
 *     class SomeClass {
 *         constructor( arg1, arg2 ) {}
 *     }
 *     new SomeClass( 1 );  // no arg2
 *
 *     function myFn( arg1, arg2 ) {}
 *     myFn();  // no args
 *
 *
 * Output class and function:
 *
 *     class SomeClass {
 *         constructor( arg1, arg2? ) {}  // <-- arg2 marked as optional
 *     }
 *
 *     function myFn( arg1?, arg2? ) {}   // <-- arg1 and arg2 marked as optional
 */
function addOptionals(minArgsMap: Map<FunctionTransformTarget, number>) {
	const fns = minArgsMap.keys();

	for (const fn of fns) {
		const fnParams = fn.getParameters();

		const numParams = fnParams.length;
		const minNumberOfCallArgs = minArgsMap.get(fn)!;

		// Mark all parameters greater than the minNumberOfCallArgs as
		// optional (if it's not a rest parameter or already has a default value)
		for (let i = minNumberOfCallArgs; i < numParams; i++) {
			const param = fnParams[i];

			if (!param.isRestParameter() && !param.hasInitializer()) {
				param.setHasQuestionToken(true);
			}
		}
	}
}

function getJsDocElements(nameableFunctions: NameableFunction[]): jsDocElement[] | undefined {
	const jsDocElements: jsDocElement[] = [];
	let jsdocs: JSDoc[] | undefined;

	nameableFunctions?.forEach((methodDeclaration) => {
		jsdocs = methodDeclaration?.getJsDocs();
		getJsDocs(methodDeclaration, jsdocs, jsDocElements);
	});

	return jsDocElements.length > 0 ? jsDocElements : undefined;
}

function getJsDocs(fn: NameableFunction, jsdocs: JSDoc[] | undefined, jsDocElements: jsDocElement[]) {
	jsdocs?.forEach((jsDoc: JSDoc, i: number) => {
		const tags = jsDoc.getTags();
		const element = new jsDocElement();
		element.description = jsDoc.getDescription();
		element.className = undefined;
		element.methodName = fn instanceof ConstructorDeclaration ? "constructor" : fn.getName();
		element.returnType = fn instanceof ConstructorDeclaration ? undefined : fn.getReturnType().getText();

		if (fn instanceof ConstructorDeclaration) {
			element.methodName = "constructor";
			element.returnType = undefined;
		} else {
			element.methodName = fn.getName();
			element.returnType = fn.getReturnType().getText();
		}

		if (fn instanceof SetAccessorDeclaration) {
			element.isSetAccessor = true;
		}
		if (fn instanceof GetAccessorDeclaration) {
			element.isGetAccessor = true;
		}

		for (let i = 0; i < tags?.length; i++) {
			const tag = tags[i];
			const tagElement = new jsDocElement();

			tagElement.methodName = element.methodName;
			tagElement.isTag = true;
			tagElement.tagName = tag.getTagName();
			tagElement.tagcomment = tag.getCommentText();
			tagElement.tagText = tag.getText();

			if (tag instanceof JSDocTypeTag) {
				const typeTag = tag as JSDocTypeTag;
				const type = typeTag.getTypeExpression()?.getTypeNode()?.getText();

				tagElement.paramName = tagElement.tagName;
				if (element.isSetAccessor) {
					tagElement.isSetAccessor = true;
					tagElement.paramType = type;
				}

				if (element.isGetAccessor) {
					tagElement.isGetAccessor = true;
					tagElement.returnType = type;
				}
			}

			if (tag instanceof JSDocParameterTag) {
				const paramTag = tag as JSDocParameterTag;

				tagElement.isParamBracketed = paramTag.isBracketed();
				tagElement.paramName = paramTag.getName();
				tagElement.paramType = paramTag.getTypeExpression()?.getTypeNode()?.getText();
			}
			if (tagElement.isParam) {
				jsDocElements.push(tagElement);
			}
		}
		jsDocElements.push(element);
	});
}

function getClassParameterType(className: string, propertyName: string, jsDocElements: jsDocElement[] | undefined): jsDocElement | undefined {
	return jsDocElements?.find((item) => item.paramName === propertyName && item.className === className);
}

function getMethodParameterType(methodName: string | undefined, propertyName: string, jsDocElements: jsDocElement[] | undefined): jsDocElement | undefined {
	return jsDocElements?.find((item) => item.paramName === propertyName && item.methodName === methodName);
}

function getReturnType(methodName: string | undefined, jsDocElements: jsDocElement[] | undefined): jsDocElement | undefined {
	return jsDocElements?.find((item) => item.methodName === methodName && item.returnType !== undefined);
}

function getGetAccessorReturnType(methodName: string | undefined, jsDocElements: jsDocElement[] | undefined): jsDocElement | undefined {
	return jsDocElements?.find((item) => item.methodName === methodName && item.isGetAccessor && item.returnType !== undefined);
}

function walkParameterTree(bindingElements: BindingElement[], parameterElements: parameterElement[]) {
	// Smart function parameters - https://javascript.info/destructuring-assignment#smart-function-parameters
	//   { p1 = "P1", p2 = 100, p3 = { p21: "P21", p22: { p31: "P31" } } }
	bindingElements.forEach((param) => {
		const parameterElt = new parameterElement(param.getName(), param.getType()?.getText(), param.getInitializer()?.getText());
		const nextBindingElements = param.getDescendantsOfKind(SyntaxKind.BindingElement);
		const type = param.getType();
		const compilerType = type.compilerType;
		const paramProperties = compilerType.getProperties();

		if (paramProperties.length > 0 && paramProperties.length < 6) {
			paramProperties.forEach((param) => {
				const n = param.getName();
				const d = param.getDeclarations();

				if (d?.length! > 0) {
					d?.forEach((dec) => {
						// TODO: Get name, type, initializer
					});
				}
			});
		}

		if (nextBindingElements.length > 0) {
			parameterElt.children = walkParameterTree(nextBindingElements, parameterElements);
		}
		parameterElements.push(parameterElt);
	});
	return parameterElements;
}
