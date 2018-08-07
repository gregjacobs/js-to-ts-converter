import Project, { CallExpression, ClassDeclaration, ConstructorDeclaration, FunctionDeclaration, MethodDeclaration, NewExpression, Node, SourceFile, SyntaxKind } from "ts-simple-ast";
import logger from "../logger/logger";

type NameableFunction = FunctionDeclaration | MethodDeclaration;
type FunctionTransformTarget = NameableFunction | ConstructorDeclaration;

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
export function addOptionalsToFunctionParams( tsAstProject: Project ): Project {
	logger.verbose( 'Beginning routine to mark function parameters as optional when calls exist that supply fewer args than parameters...' );
	const sourceFiles = tsAstProject.getSourceFiles();

	logger.verbose( 'Parsing function/method/constructor calls from codebase.' );
	const constructorMinArgsMap = parseClassConstructorCalls( sourceFiles );
	const functionsMinArgsMap = parseFunctionAndMethodCalls( sourceFiles );

	logger.verbose( 'Marking parameters as optional' );
	addOptionals( constructorMinArgsMap );
	addOptionals( functionsMinArgsMap );

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
function parseClassConstructorCalls( sourceFiles: SourceFile[] ): Map<ConstructorDeclaration, number> {
	logger.verbose( 'Finding all calls to class constructors...' );
	const constructorMinArgsMap = new Map<ConstructorDeclaration, number>();

	sourceFiles.forEach( ( sourceFile: SourceFile ) => {
		logger.verbose( `    Processing classes in source file: ${sourceFile.getFilePath()}` );
		const classes = sourceFile.getDescendantsOfKind( SyntaxKind.ClassDeclaration );

		classes.forEach( ( classDeclaration: ClassDeclaration ) => {
			const constructorFns = classDeclaration.getConstructors() || [];
			const constructorFn = constructorFns.length > 0 ? constructorFns[ 0 ] : undefined;  // only grab the first since we're converting JavaScript

			// If there is no constructor function for this class, then nothing to do
			if( !constructorFn ) {
				return;
			}

			logger.verbose( `        Looking for calls to the constructor of class: '${classDeclaration.getName()}'` );

			const constructorFnParams = constructorFn.getParameters();
			const numParams = constructorFnParams.length;

			const referencedNodes = classDeclaration.findReferencesAsNodes();

			const callsToConstructor = referencedNodes
				.map( ( node: Node ) => node.getFirstAncestorByKind( SyntaxKind.NewExpression ) )
				.filter( ( node ): node is NewExpression => !!node );

			logger.debug( `        Found ${callsToConstructor.length} call(s) to the constructor` );

			const minNumberOfCallArgs = callsToConstructor
				.reduce( ( minCallArgs: number, call: NewExpression ) => {
					return Math.min( minCallArgs, call.getArguments().length );
				}, numParams );

			if( callsToConstructor.length > 0 ) {
				logger.debug( `        Constructor currently expects ${numParams} params. Call(s) to the constructor supply a minimum of ${minNumberOfCallArgs} args.` );
			}

			constructorMinArgsMap.set( constructorFn, minNumberOfCallArgs );
		} );
	} );

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
function parseFunctionAndMethodCalls( sourceFiles: SourceFile[] ): Map<NameableFunction, number> {
	logger.verbose( 'Finding all calls to functions/methods...' );
	const functionsMinArgsMap = new Map<NameableFunction, number>();

	sourceFiles.forEach( ( sourceFile: SourceFile ) => {
		logger.verbose( `    Processing functions/methods in source file: ${sourceFile.getFilePath()}` );
		const fns = getFunctionsAndMethods( sourceFile );

		fns.forEach( ( fn: NameableFunction ) => {
			logger.verbose( `        Looking for calls to the function: '${fn.getName()}'` );
			const fnParams = fn.getParameters();
			const numParams = fnParams.length;

			const referencedNodes = fn.findReferencesAsNodes();

			const callsToFunction = referencedNodes
				.map( ( node: Node ) => node.getFirstAncestorByKind( SyntaxKind.CallExpression ) )
				.filter( ( node ): node is CallExpression => !!node );

			logger.debug( `        Found ${callsToFunction.length} call(s) to the function '${fn.getName()}'` );

			const minNumberOfCallArgs = callsToFunction
				.reduce( ( minCallArgs: number, call: CallExpression ) => {
					return Math.min( minCallArgs, call.getArguments().length );
				}, numParams );

			if( callsToFunction.length > 0 ) {
				logger.debug( `        Function currently expects ${numParams} params. Call(s) to the function/method supply a minimum of ${minNumberOfCallArgs} args.` );
			}

			functionsMinArgsMap.set( fn, minNumberOfCallArgs );
		} );
	} );

	return functionsMinArgsMap;
}


/**
 * Retrieves all FunctionDeclarations and MethodDeclarations from the given
 * source file.
 */
function getFunctionsAndMethods(
	sourceFile: SourceFile
): NameableFunction[] {
	return ( [] as NameableFunction[] ).concat(
		sourceFile.getDescendantsOfKind( SyntaxKind.FunctionDeclaration ),
		sourceFile.getDescendantsOfKind( SyntaxKind.MethodDeclaration )
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
function addOptionals( minArgsMap: Map<FunctionTransformTarget, number> ) {
	const fns = minArgsMap.keys();

	for( const fn of fns ) {
		const fnParams = fn.getParameters();

		const numParams = fnParams.length;
		const minNumberOfCallArgs = minArgsMap.get( fn )!;

		// Mark all parameters greater than the minNumberOfCallArgs as
		// optional (if it's not a rest parameter or already has a default value)
		for( let i = minNumberOfCallArgs; i < numParams; i++ ) {
			const param = fnParams[ i ];

			if( !param.isRestParameter() && !param.hasInitializer() ) {
				param.setHasQuestionToken( true );
			}
		}
	}
}