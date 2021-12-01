import { Project, ClassInstancePropertyTypes, ClassDeclaration, PropertyDeclarationStructure, Scope, JSDocParameterTag, JSDoc, JSDocTag, JSDocUnknownTag, JSDocPropertyTag } from "ts-morph";
import { parseJsClasses } from "./parse-js-classes";
import { correctJsProperties } from "./correct-js-properties";
import logger from "../../logger/logger";
import { jsDocElement } from "../jsDocElement";

/**
 * Parses all source files looking for ES6 classes, and takes any `this`
 * property access to create a PropertyDeclaration for the class.
 *
 * For example:
 *
 *     class Something {
 *         constructor() {
 *             this.someProp = 1;
 *         }
 *     }
 *
 * Is changed to:
 *
 *     class Something {
 *         someProp: any;
 *
 *         constructor() {
 *             this.someProp = 1;
 *         }
 *     }
 */
export function addClassPropertyDeclarations(tsAstProject: Project): Project {
	// Parse the JS classes for all of the this.xyz properties that they use
	const jsClasses = parseJsClasses(tsAstProject);

	// Correct the JS classes' properties for superclass/subclass relationships
	// (essentially remove properties from subclasses that are defined by their
	// superclasses)
	const propertiesCorrectedJsClasses = correctJsProperties(jsClasses);

	// Fill in field definitions for each of the classes
	propertiesCorrectedJsClasses.forEach((jsClass) => {
		const sourceFile = tsAstProject.getSourceFileOrThrow(jsClass.path);
		logger.verbose(`  Updating class '${jsClass.name}' in '${sourceFile.getFilePath()}'`);

		const classDeclaration = sourceFile.getClassOrThrow(jsClass.name!);
		const jsClassProperties = jsClass.properties;
		const jsDocElements = getJsDocElements(classDeclaration);

		// If the utility was run against a TypeScript codebase, we should not
		// fill in property declarations for properties that are already
		// declared in the class. However, we *should* fill in any missing
		// declarations. Removing any already-declared declarations from the
		// jsClassProperties.
		const currentPropertyDeclarations = classDeclaration.getInstanceProperties().reduce((props: Set<string>, prop: ClassInstancePropertyTypes) => {
			const propName = prop.getName();
			return propName ? props.add(propName) : props;
		}, new Set<string>());

		let undeclaredProperties = [...jsClassProperties].filter((propName: string) => !currentPropertyDeclarations.has(propName));

		// If the utility found a reference to this.constructor, we don't want to
		// add a property called 'constructor'. Filter that out now.
		// https://github.com/gregjacobs/js-to-ts-converter/issues/9
		undeclaredProperties = undeclaredProperties.filter((propName: string) => propName !== "constructor");

		// Add all currently-undeclared properties
		const propertyDeclarations = undeclaredProperties.map((propertyName, i: number) => {
			const types = getTypes(propertyName, classDeclaration, jsDocElements);

			// If optional add '?' to property name in undeclaredProperties
			if (types?.tsIsOptional) {
				undeclaredProperties[i] = types?.tsName!;
			}
			return {
				name: types?.tsIsOptional ? types?.tsName + "?" : types?.tsName,
				type: types?.tsType,
				scope: Scope.Public,
			} as PropertyDeclarationStructure;
		});

		logger.verbose(`    Adding property declarations for properties: '${undeclaredProperties.join("', '")}'`);
		classDeclaration.insertProperties(0, propertyDeclarations);

		// logger.verbose(`    Setting property defaults for properties: '${undeclaredProperties.join("', '")}'`);
		undeclaredProperties.map((propertyName) => {
			const types = getTypes(propertyName, classDeclaration, jsDocElements);

			// Add default value to a property
			const propDeclaration = classDeclaration.getPropertyOrThrow(propertyName);
			if (propDeclaration !== null) {
				if (types?.tsDefault) {
					propDeclaration.setInitializer(types?.tsDefault);
				}
				if (types?.commentText !== "") {
					const comments = propDeclaration.getLeadingCommentRanges();
				}
			}
		});
	});

	return tsAstProject;
}

function getTypesFromComment(
	propertyName: string,
	classDeclaration: ClassDeclaration
): {
	tsName: string;
	tsType: string;
	tsIsOptional: boolean;
	tsIsUnion: boolean;
	tsDefault: string;
	commentText: string;
	oaType: string;
	oaFormat: string;
} {
	let tsName = propertyName;
	let tsType = "any";
	let tsIsOptional = false;
	let tsIsUnion = false;
	let tsDefault = "";
	let commentText = "";
	let oaType = "";
	let oaFormat = "";
	const constructors = classDeclaration.getConstructors().map((constructor) => {
		const statements = constructor.getStatementsWithComments().map((statement) => {
			const statementText = statement.getText();
			if (statementText.includes(propertyName)) {
				const comments = statement.getTrailingCommentRanges().map((comment) => {
					commentText = comment.getText();

					// Types: [`TS Type` #TS Default# ^OA Type^ ~OA Format~] - https://regex101.com

					// TS Type pattern: (?<=`).*(?=`)
					const tsTypeMatch = commentText.match(/(?<=`).*(?=`)/);
					if (tsTypeMatch !== null) {
						tsType = tsTypeMatch[0];
					}

					// TS is Optional pattern: (?<=@).*(?=@)
					const tsIsOptionalMatch = commentText.match(/(?<=@).*(?=@)/);
					if (tsIsOptionalMatch !== null) {
						tsIsOptional = tsIsOptionalMatch[0] === "true";
					}

					// TS Default pattern: (?<=#).*(?=#)
					const tsDefaultMatch = commentText.match(/(?<=#).*(?=#)/);
					if (tsDefaultMatch !== null) {
						tsDefault = tsDefaultMatch[0];
					}

					// OA Type pattern: (?<=\^).*(?=\^)
					const oaTypeMatch = commentText.match(/(?<=\^).*(ß?=\^)/);
					if (oaTypeMatch !== null) {
						oaType = oaTypeMatch[0];
					}

					// OA Format pattern: (?<=~).*(?=~)
					const oaFormatMatch = commentText.match(/(?<=~).*(?=~)/);
					if (oaFormatMatch !== null) {
						oaFormat = oaFormatMatch[0];
					}
				});
			}
		});
	});
	return { tsName, tsType, tsIsOptional, tsIsUnion, tsDefault, commentText, oaType, oaFormat };
}

function getJsDocElements(classDecl: ClassDeclaration | undefined): jsDocElement[] | undefined {
	const jsDocElements: jsDocElement[] = [];

	for (let i = 0; i <= 1; i++) {
		let jsdocs: JSDoc[] | undefined;

		// Get class JSDoc
		if (i === 0) {
			jsdocs = classDecl?.getJsDocs();
		}

		// Get Constructor JSDoc
		if (i === 1) {
			const constrDecl = classDecl?.getConstructors()[0];
			jsdocs = constrDecl?.getJsDocs();
		}

		jsdocs?.forEach((jsDoc: JSDoc, i: number) => {
			const tags = jsDoc.getTags();
			const element = new jsDocElement();
			element.description = jsDoc.getDescription();
			element.className = classDecl?.getName();

			if (i === 1) {
				element.methodName = "constructor";
			}

			tags?.forEach((tag: JSDocTag) => {
				const tagElement = new jsDocElement();
				tagElement.isTag = true;
				tagElement.tagName = tag.getTagName();
				tagElement.tagcomment = tag.getCommentText();
				tagElement.tagText = tag.getText();

				if (tagElement.tagName === "property") {
					const i = 0;
				}

				if (tag instanceof JSDocUnknownTag && tagElement.tagName == "property") {
					tagElement.isParam = true;
					const propertyTag = tag as JSDocUnknownTag;

					// TODO: get @property name, type comment the ts-morph way
					let paramNameType = tagElement.tagcomment;
					const commentLen = tagElement.tagcomment?.length!;
					let commentPos = tagElement.tagcomment?.indexOf(" - ")!;

					if (commentPos > 0) {
						paramNameType = paramNameType?.substring(0, commentPos);
						commentPos += 3;
						tagElement.tagcomment = tagElement.tagcomment?.substring(commentPos);
					}
					const matchesLastWord = paramNameType?.match(/\b(\w+)$/g);
					if (matchesLastWord && matchesLastWord.length > 0) {
						tagElement.paramName = matchesLastWord[0];
					}

					const matches = paramNameType?.match(/(?<=\{).+?(?=\})/g);
					if (matches && matches.length > 0) {
						tagElement.paramType = matches[0];
					}
				}

				if (tag instanceof JSDocParameterTag || tag instanceof JSDocPropertyTag) {
					tagElement.isParam = true;
					const paramTag = tag as JSDocParameterTag;
					tagElement.paramName = paramTag.getName();
					tagElement.paramType = paramTag.getTypeExpression()?.getTypeNode()?.getText();

					// TODO: find the right ts-morph way to get this
					if (tagElement.paramType?.startsWith("?")) {
						tagElement.isParamTypeOptional = true;
						tagElement.paramType = tagElement.paramType.replace("?", "");
					}

					// TODO: find the right ts-morph way to get this
					if (tagElement.paramType?.includes("|")) {
						tagElement.isParamTypeUnion = true;
					}
				}
				jsDocElements.push(tagElement);
			});

			jsDocElements.push(element);
		});
	}

	return jsDocElements.length > 0 ? jsDocElements : undefined;
}

function getTypes(
	propertyName: string,
	classDeclaration: ClassDeclaration,
	jsDocElements: jsDocElement[] | undefined
): {
	tsName: string | undefined;
	tsType: string | undefined;
	tsIsOptional: boolean | undefined;
	tsIsUnion: boolean | undefined;
	tsDefault: string;
	commentText: string | undefined;
	oaType: string | undefined;
	oaFormat: string | undefined;
} | null {
	if (jsDocElements && jsDocElements?.length > 0) {
		const jsDocElement = getPropertyType(propertyName, jsDocElements);
		let tsName = jsDocElement?.paramName;
		let tsType = jsDocElement?.paramType;
		let tsIsOptional = jsDocElement?.isParamTypeOptional;
		let tsIsUnion = jsDocElement?.isParamTypeUnion;
		let tsDefault = "";
		let commentText = jsDocElement?.tagcomment;
		let oaType = undefined;
		let oaFormat = undefined;

		return { tsName, tsType, tsIsOptional, tsIsUnion, tsDefault, commentText, oaType, oaFormat };
	} else {
		return getTypesFromComment(propertyName, classDeclaration);
	}
}

function getPropertyType(propertyName: string, jsDocElements: jsDocElement[]): jsDocElement | undefined {
	return jsDocElements.find((item) => item.paramName === propertyName);
}
