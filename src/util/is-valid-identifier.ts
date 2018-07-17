/**
 * Helper to determine if a string of text is a valid JavaScript identifier.
 */
export function isValidIdentifier( text: string ) {
	return /^[\w$]+$/.test( text );
}