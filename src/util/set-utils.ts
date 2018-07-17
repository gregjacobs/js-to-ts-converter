/**
 * Unions two or more sets to create a combined set. Does not mutate the input
 * sets.
 */
export function union<T>( setA: Set<T>, ...sets: Set<T>[] ) {
	const union = new Set<T>( setA );

	sets.forEach( currentSet => {
		for( const elem of currentSet ) {
			union.add( elem );
		}
	} );
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