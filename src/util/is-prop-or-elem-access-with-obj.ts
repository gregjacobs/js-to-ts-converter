import { ElementAccessExpression, Identifier, Node, PropertyAccessExpression, TypeGuards } from "ts-simple-ast";

/**
 * Determines if the given `node` is a PropertyAccessExpression or
 * ElementAccessExpression whose object is `obj`.
 *
 * Example, in the following expression:
 *
 *     obj.a
 *
 * This function will return true if called as:
 *
 *     isPropOrElemAccessWithObj( expr, 'obj' );
 */
export function isPropOrElemAccessWithObj(
	node: Node,
	objIdentifier: string
): node is PropertyAccessExpression | ElementAccessExpression {
	if( !TypeGuards.isPropertyAccessExpression( node ) && !TypeGuards.isElementAccessExpression( node ) ) {
		return false;
	}

	const expr = node.getExpression();

	if( objIdentifier === 'this' ) {
		return TypeGuards.isThisExpression( expr );

	} else if( TypeGuards.isIdentifier( expr ) ) {
		const identifier = expr as Identifier;

		return identifier.getText() === objIdentifier;

	} else {
		return false;
	}
}

/**
 * Function intended to be used with Array.prototype.filter() to return any
 * PropertyAccessExpression or ElementAccessExpression that uses the object
 * `obj`.
 *
 * For example, in this source code:
 *
 *     const obj = { a: 1, b: 2 };
 *     obj.a = 3;
 *     obj['b'] = 4;
 *
 *     const obj2 = { a: 3, b: 4 };
 *     obj2.a = 5;
 *     obj2['b'] = 6;
 *
 * We can use the following to find the two 'obj2' property accesses:
 *
 *     const propAccesses = sourceFile
 *         .getDescendantsOfKind( SyntaxKind.PropertyAccessExpression );
 *
 *     const obj2PropAccesses = propAccesses
 *         .filter( topLevelPropOrElemAccessFilter( 'obj2' ) );
 */
export function propOrElemAccessWithObjFilter( objIdentifier: string ) {
	return ( node: Node ): node is PropertyAccessExpression | ElementAccessExpression => {
		return isPropOrElemAccessWithObj( node, objIdentifier );
	};
}