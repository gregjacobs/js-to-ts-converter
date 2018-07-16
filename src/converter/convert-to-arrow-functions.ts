import * as ts from 'typescript';
import Project, { ClassDeclaration, FunctionExpression, Identifier, MethodDeclaration, ParameterDeclaration, PropertyAccessExpression, SourceFile, SyntaxKind, TypeGuards, VariableDeclaration } from "ts-simple-ast";

/**
 * Parses the classes out of each .js file in the SourceFilesCollection, and
 * transforms any function expressions found into arrow functions.
 *
 * Also removes any `var that = this;` statements, and replaces usages of the
 * variable `that` (or whichever identifier is used for it) back to `this`.
 */
export function convertToArrowFunctions( tsAstProject: Project ): Project {
	const sourceFiles = tsAstProject.getSourceFiles();

	sourceFiles.forEach( ( sourceFile: SourceFile ) => {
		const classes = sourceFile.getClasses();

		classes.forEach( ( classDeclaration: ClassDeclaration ) => {
			// Mutates the ClassDeclaration - no good way to make this an
			// immutable transform
			replaceFunctionExpressions( classDeclaration );
			replaceSelfReferencingVars( classDeclaration );
		} );
	} );

	return tsAstProject;
}


/**
 * Replaces old-style function expressions with arrow functions.
 *
 * Ex input:
 *
 *    var something = function( a, b ) { ... }
 *
 * Transformed to:
 *
 *    var something = ( a, b ) => { ... }
 */
function replaceFunctionExpressions( classDeclaration: ClassDeclaration ) {
	const functionExpressions = classDeclaration.getDescendantsOfKind( SyntaxKind.FunctionExpression );

	functionExpressions.forEach( ( functionExpression: FunctionExpression ) => {
		let newText = `(` + paramsToText( functionExpression ) + `) => `;
		newText += functionExpression.getBody().getFullText()
			.replace( /^\s*/, '' );  // replace any leading spaces from the function body

		console.log( newText );

		functionExpression.replaceWithText( newText );
	} );
}


/**
 * Reads the parameters of a function expression and returns its source text.
 */
function paramsToText( functionExpression: FunctionExpression ): string {
	return functionExpression.getParameters()
		.map( ( param: ParameterDeclaration ) => param.getFullText() )
		.join( ',' );
}


/**
 * Replaces variables that were needed before arrow functions to maintain the
 * `this` reference in inner functions.
 *
 * Ex:
 *
 *     var that = this;
 *
 *     var myFn = function() {
 *         console.log( that.someProp );
 *     }
 *
 * Replaced with:
 *
 *     var myFn = () => {
 *         console.log( this.someProp );  // note: `that` -> `this`
 *     };
 */
function replaceSelfReferencingVars( classDeclaration: ClassDeclaration ) {
	const methods = classDeclaration.getMethods();

	methods.forEach( ( method: MethodDeclaration ) => {
		const thisVarDeclarations = method
			.getDescendantsOfKind( SyntaxKind.VariableDeclaration )
			.filter( ( varDec: VariableDeclaration ) => {
				return !!varDec.getInitializerIfKind( SyntaxKind.ThisKeyword );
			} );

		const thisVarIdentifiers = thisVarDeclarations
			.map( ( thisVarDec: VariableDeclaration ) => thisVarDec.getName() );

		// Get PropertyAccessExpressions that use the `thisVarIdentifiers` as
		// their expression, but only if their parents are not PropertyAccessExpressions
		// of their own.
		//
		// We want to grab expressions of the form:
		//    `that.someProp`
		// but not expressions like:
		//    `something.that.someProp`
		const propAccessesOfThisVarIdentifiers = method
			.getDescendantsOfKind( SyntaxKind.PropertyAccessExpression )
			.filter( ( propAccess: PropertyAccessExpression ) => {
				// keep the PropertyAccessExpression if it is a "top-level"
				// PropertyAccessExpression. Meaning, we want `that.someProp`,
				// but not nested PropertyAccessExpressions like `something.that.someProp`
				return !propAccess.getParentIfKind( SyntaxKind.PropertyAccessExpression );
			} )
			.filter( ( propAccess: PropertyAccessExpression ) => {
				const expr = propAccess.getExpression() as Identifier;

				if( TypeGuards.isIdentifier( expr ) ) {
					const name = expr.getText();
					return thisVarIdentifiers.includes( name );
				} else {
					return false;
				}
			} );

		// TODO: Change propAccessesOfThisVarIdentifiers to use `this` as their
		// expression instead of `that`


	} );
}