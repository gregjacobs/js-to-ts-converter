import { ElementAccessExpression, Identifier, Node, PropertyAccessExpression, TypeGuards } from "ts-morph";
import { isPropertyAccessWithObj } from "./is-property-access-with-obj";
import { isElementAccessWithObj } from "./is-element-access-with-obj";

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
export function isPropertyOrElemementAccessWithObj(
	node: Node,
	objIdentifier: string
): node is PropertyAccessExpression | ElementAccessExpression {
	return isPropertyAccessWithObj( node, objIdentifier )
		|| isElementAccessWithObj( node, objIdentifier );
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
 *     const propOrElementAccesses = sourceFile
 *         .getDescendantsOfKind( SyntaxKind.PropertyAccessExpression )
 *         .concat( sourceFile
 *             .getDescendantsOfKind( SyntaxKind.ElementAccessExpression )
 *         );
 *
 *     const obj2PropOrElemAccesses = propOrElementAccesses
 *         .filter( propertyOrElementAccessWithObjFilter( 'obj2' ) );
 */
export function propertyOrElementAccessWithObjFilter( objIdentifier: string ): ( node: Node ) => node is PropertyAccessExpression | ElementAccessExpression {
	return ( node: Node ): node is PropertyAccessExpression | ElementAccessExpression => {
		return isPropertyOrElemementAccessWithObj( node, objIdentifier );
	};
}