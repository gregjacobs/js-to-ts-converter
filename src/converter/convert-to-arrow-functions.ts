import Project, { ClassDeclaration, ElementAccessExpression, FunctionExpression, Identifier, MethodDeclaration, Node, ParameterDeclaration, PropertyAccessExpression, SourceFile, SyntaxKind, TypeGuards, VariableDeclaration } from "ts-simple-ast";
import { propOrElemAccessWithObjFilter } from "../util/is-prop-or-elem-access-with-obj";
import { isThisReferencingVar } from "../util/is-this-referencing-var";
const TraceError = require( 'trace-error' );

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
	const className = classDeclaration.getName();
	const functionExpressions = classDeclaration.getDescendantsOfKind( SyntaxKind.FunctionExpression );
	const functionExpressionsText = functionExpressions.map( fe => fe.getFullText() );  // for debugging, which may be needed after some function expressions have been replaced

	// Need to process the function expressions in reverse order to produce a
	// bottom-up transformation. If we do top down, we can replace a parent
	// function expression before the child function expression, and then we
	// access a node (the child function expression) that has been removed
	functionExpressions.reverse().forEach( ( functionExpression: FunctionExpression, i: number ) => {
		try {
			let newText = `(` + paramsToText( functionExpression ) + `) => `;
			newText += functionExpression.getBody().getFullText()
				.replace( /^\s*/, '' );  // replace any leading spaces from the function body

			functionExpression.replaceWithText( newText );
		} catch( error ) {
			throw new TraceError( `
				An error occurred while trying to replace a function expression
				with an arrow function. Was processing class ${className}, and
				looking at a function expression with text:
				
				${functionExpressionsText[ i ]}
			`.trim().replace( /^\t*/gm, '' ), error );
		}
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
	const sourceFile = classDeclaration.getSourceFile();  // for debugging info
	const methods = classDeclaration.getMethods();

	methods.forEach( ( method: MethodDeclaration ) => {
		const methodText = method.getFullText();  // for debugging info

		try {
			doReplaceSelfReferencingVars( method );

		} catch( error ) {
			throw new TraceError( `
				An error occurred while converting variables which refer to \`this\`
				with the \`this\` keyword itself. 
				
				Was processing file: '${sourceFile.getFilePath()}'.
				Processing the method with text: 
				  ${methodText}.
			`.trim().replace( /^\t*/gm, '' ), error );
		}
	} );
}

/**
 * Performs the actual replacements for {@link #replaceSelfReferencingVars}.
 */
function doReplaceSelfReferencingVars( node: Node ) {
	// find var declarations like `var that = this;` or `var self = this;`
	const thisVarDeclarations = node
		.getDescendantsOfKind( SyntaxKind.VariableDeclaration )
		.filter( isThisReferencingVar );

	// Get the array of identifiers assigned to `this`. Ex: [ 'that', 'self' ]
	const thisVarIdentifiers = thisVarDeclarations
		.map( ( thisVarDec: VariableDeclaration ) => thisVarDec.getName() );


	// Remove the `var that = this` or `var self = this` variable
	// declarations. Seems to need to be done before the `that->this`
	// conversions in some cases, so putting it before
	thisVarDeclarations.forEach( ( varDec: VariableDeclaration ) => {
		varDec.remove();
	} );

	replaceThisVarsWithThisKeyword( node, thisVarIdentifiers );
}


/**
 * Replaces any variables that referenced `this` with the `this` keyword itself.
 */
function replaceThisVarsWithThisKeyword(
	node: Node,
	thisVarIdentifiers: string[]  // ex: [ 'that', 'self', 'me' ]
) {
	thisVarIdentifiers.forEach( ( thisVarIdentifier: string ) => {
		try {
			doReplaceThisVarWithThisKeyword( node, thisVarIdentifier );

		} catch( error ) {
			throw new TraceError( `
				An error occurred while converting variables which refer to \`this\`
				(the identifier(s): '${thisVarIdentifiers.join("',")}') with the 
				\`this\` keyword itself. 
				
				Was attempting to replace identifier '${thisVarIdentifier}' with the 'this' keyword.
			`.trim().replace( /^\t*/gm, '' ), error );
		}
	} );
}


/**
 * Performs the actual replacements for the {@link #replaceThisVarsWithThisKeyword}
 * function.
 */
function doReplaceThisVarWithThisKeyword(
	node: Node,
	thisVarIdentifier: string  // ex: 'that' or 'self'
) {
	const nodeText = node.getFullText();  // for debuggig information

	// grab PropertyAccessExpressions like `that.someProp` or `self.someProp`
	const propAccessesOfThisVarIdentifiers: (PropertyAccessExpression | ElementAccessExpression)[] = node
		.getDescendants()
		.filter( propOrElemAccessWithObjFilter( thisVarIdentifier ) );  // seem to need to do this transformation in a bottom-up manner, or we can run into the error of "Attempted to get information from a node that was removed or forgotten"

	// Change propAccessesOfThisVarIdentifiers to use `this` as their
	// expression (object) instead of `that`/`self`/etc.
	propAccessesOfThisVarIdentifiers.forEach( ( propAccess: PropertyAccessExpression | ElementAccessExpression ) => {
		const propAccessText = propAccess.getText();

		try {
			// Attempt workaround for very long property access expressions.
			// If we just replace the `that.something` part of `that.something.something2.something3.something4`,
			// then ts-simple-ast throws an error. So replacing the entire
			// chained PropertyAccessExpression instead.
			let parentMostPropAccess = propAccess as Node;
			while( parentMostPropAccess.getParentIfKind( SyntaxKind.PropertyAccessExpression ) ) {
				parentMostPropAccess = parentMostPropAccess.getParent()!;
			}

			const newText = parentMostPropAccess.getText()
				.replace( new RegExp( '^' + thisVarIdentifier ), 'this' );

			parentMostPropAccess.replaceWithText( newText );

			// Old workaround #2: Failed at 4 levels of properties:
			//    that.something1.something2.something3.something4
			// const newText = propAccessText
			// 	.replace( new RegExp( '^' + thisVarIdentifier ), 'this' );
			//
			// console.log( 'new text: ', newText );
			// propAccess.replaceWithText( newText );

			// Old code which threw an error when we had a long PropertyAccessExpression
			// like `that.something1.something2.something3`
			//const identifier = propAccess.getExpression() as Identifier;
			//identifier.replaceWithText( `this` );

		} catch( error ) {
			throw new TraceError( `
				An error occurred while attempting to convert the expression:
				  ${propAccessText} 
				to replace '${thisVarIdentifier}' with the 'this' keyword.
				
				Was looking at node with text:
				
				${nodeText}
			`.trim().replace( /^\t*/gm, '' ), error );
		}
	} );
}