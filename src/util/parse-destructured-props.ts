import { ts, SyntaxKind } from "ts-morph";

/**
 * Given a ts.ObjectBindingPattern node, returns an array of the names that
 * are bound to it.
 *
 * These names are essentially the property names pulled out of the object.
 *
 * Example:
 *
 *     var { a, b } = this;
 *
 * Returns:
 *
 *     [ 'a', 'b' ]
 */
export function parseDestructuredProps( node: ts.ObjectBindingPattern ): string[] {
	const elements = node.elements;

	return elements
		.filter( ( element: ts.BindingElement ) => {
			return element.name.kind === SyntaxKind.Identifier;
		} )
		.map( ( element: ts.BindingElement ) => {
			return ( element.name as ts.Identifier ).text;
		} );
}