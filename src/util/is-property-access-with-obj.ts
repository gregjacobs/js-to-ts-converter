import { Identifier, Node, PropertyAccessExpression, TypeGuards } from "ts-simple-ast";

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
 *     isPropertyOrElemementAccessWithObj( expr, 'obj' );
 */
export function isPropertyAccessWithObj(
	node: Node,
	objIdentifier: string
): node is PropertyAccessExpression {
	if( !TypeGuards.isPropertyAccessExpression( node ) ) {
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
 * PropertyAccessExpression that uses the object `obj`.
 *
 * For example, in this source code:
 *
 *     const obj = { a: 1, b: 2 };
 *     obj.a = 3;
 *
 *     const obj2 = { a: 3, b: 4 };
 *     obj2.b = 5;
 *
 * We can use the following to find the 'obj2' property access:
 *
 *     const propAccesses = sourceFile
 *         .getDescendantsOfKind( SyntaxKind.PropertyAccessExpression );
 *
 *     const obj2PropAccesses = propAccesses
 *         .filter( propAccessWithObjFilter( 'obj2' ) );
 */
export function propertyAccessWithObjFilter( objIdentifier: string ) {
	return ( node: Node ): node is PropertyAccessExpression => {
		return isPropertyAccessWithObj( node, objIdentifier );
	};
}