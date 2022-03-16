import { ElementAccessExpression, Identifier, Node } from "ts-morph";

/**
 * Determines if the given `node` is a ElementAccessExpression whose object is
 * `obj`.
 *
 * Example, in the following expression:
 *
 *     obj['a']
 *
 * This function will return true if called as:
 *
 *     isElementAccessWithObj( expr, 'obj' );
 */
export function isElementAccessWithObj(
	node: Node,
	objIdentifier: string
): node is ElementAccessExpression {
	if( !Node.isElementAccessExpression( node ) ) {
		return false;
	}

	const expr = node.getExpression();

	if( objIdentifier === 'this' ) {
		return Node.isThisExpression( expr );

	} else if( Node.isIdentifier( expr ) ) {
		const identifier = expr as Identifier;

		return identifier.getText() === objIdentifier;

	} else {
		return false;
	}
}

/**
 * Function intended to be used with Array.prototype.filter() to return any
 * ElementAccessExpression that uses the object `obj`.
 *
 * For example, in this source code:
 *
 *     const obj = { a: 1, b: 2 };
 *     obj['a'] = 3;
 *
 *     const obj2 = { a: 3, b: 4 };
 *     obj2['b'] = 5;
 *
 * We can use the following to find the 'obj2' element access:
 *
 *     const propAccesses = sourceFile
 *         .getDescendantsOfKind( SyntaxKind.ElementAccessExpression );
 *
 *     const obj2PropAccesses = propAccesses
 *         .filter( elementAccessWithObjFilter( 'obj2' ) );
 */
export function elementAccessWithObjFilter( objIdentifier: string ): ( node: Node ) => node is ElementAccessExpression {
	return ( node: Node ): node is ElementAccessExpression => {
		return isElementAccessWithObj( node, objIdentifier );
	};
}