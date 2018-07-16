/**
 * Unions two sets to create a combined set. Does not mutate the input sets.
 */
export function union<T>( setA: Set<T>, setB: Set<T> ) {
	const union = new Set<T>( setA );
	for( const elem of setB ) {
		union.add(elem);
	}
	return union;
}


/**
 * Removes the elements of `setB` from `setA` to produce the difference. Does
 * not mutate the input sets.
 */
export function difference<T>( setA: Set<T>, setB: Set<T> ) {
	const difference = new Set( setA );
	for( const elem of setB ) {
		difference.delete( elem );
	}
	return difference;
}