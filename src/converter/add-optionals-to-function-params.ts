import Project, { CallExpression, ClassDeclaration, FunctionDeclaration, MethodDeclaration, NewExpression, Node, ParameterDeclaration, SourceFile, SyntaxKind, TypeGuards } from "ts-simple-ast";

type NameableFunction = FunctionDeclaration | MethodDeclaration;


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
 */
export function addOptionalsToFunctionParams( tsAstProject: Project ): Project {
	const sourceFiles = tsAstProject.getSourceFiles();

	sourceFiles.forEach( ( sourceFile: SourceFile ) => {
		addOptionalsToClassConstructors( sourceFile );
		addOptionalsToFunctionDeclarationsAndMethods( sourceFile );
	} );

	return tsAstProject;
}


/**
 * Handles ClassDeclarations by looking for the call sites of those classes'
 * constructors and figuring out if any parameters should be marked as optional
 * based on fewer arguments being provided than there are parameters.
 */
function addOptionalsToClassConstructors( sourceFile: SourceFile ) {
	const classes = sourceFile.getDescendantsOfKind( SyntaxKind.ClassDeclaration );

	classes.forEach( ( classDeclaration: ClassDeclaration ) => {
		const constructorFns = classDeclaration.getConstructors() || [];
		const constructorFn = constructorFns[ 0 ];  // only grab the first since we're converting JavaScript

		// If there is no constructor function for this class, then nothing to do
		if( !constructorFn ) {
			return;
		}

		const constructorFnParams = constructorFn.getParameters();
		const numParams = constructorFnParams.length;

		const referencedNodes = classDeclaration.findReferencesAsNodes();

		const callsToConstructor = referencedNodes
			.map( ( node: Node ) => node.getFirstAncestorByKind( SyntaxKind.NewExpression ) )
			.filter( ( node ): node is NewExpression => !!node );

		const minNumberOfCallArgs = callsToConstructor
			.reduce( ( minCallArgs: number, call: NewExpression ) => {
				return Math.min( minCallArgs, call.getArguments().length );
			}, numParams );

		// Mark all parameters greater than the minNumberOfCallArgs as
		// optional
		for( let i = minNumberOfCallArgs; i < numParams; i++ ) {
			constructorFnParams[ i ].setHasQuestionToken( true );
		}
	} );
}


/**
 * Handles FunctionDeclarations and MethodDeclarations by looking for the call
 * sites of those functions/methods and figuring out if any parameters should be
 * marked as optional based on fewer arguments being provided than there are
 * parameters.
 */
function addOptionalsToFunctionDeclarationsAndMethods( sourceFile: SourceFile ) {
	const fns = getFunctionsAndMethods( sourceFile );

	fns.forEach( ( fn: NameableFunction ) => {
		const fnParams = fn.getParameters();
		const numParams = fnParams.length;

		const referencedNodes = fn.findReferencesAsNodes();

		const callsToFunction = referencedNodes
			.map( ( node: Node ) => node.getFirstAncestorByKind( SyntaxKind.CallExpression ) )
			.filter( ( node ): node is CallExpression => !!node );

		const minNumberOfCallArgs = callsToFunction
			.reduce( ( minCallArgs: number, call: CallExpression ) => {
				return Math.min( minCallArgs, call.getArguments().length );
			}, numParams );

		// Mark all parameters greater than the minNumberOfCallArgs as
		// optional
		for( let i = minNumberOfCallArgs; i < numParams; i++ ) {
			fnParams[ i ].setHasQuestionToken( true );
		}
	} );
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