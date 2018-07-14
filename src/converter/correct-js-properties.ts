import { JsClass } from "../model/js-class";
import { Graph, alg } from "graphlib";

/**
 * After the graph of original {@link JsClass}es and their properties have been
 * created, we need to remove properties from subclasses that are defined in
 * their superclasses.
 *
 * This function takes the original graph of classes with all properties in each
 * class and returns a new list of JsClasses with the properties properly
 * filtered so that subclasses do not define the same properties that are
 * already present in their superclasses.
 *
 * ## Algorithm
 *
 * 1. Build graph of subclasses -> superclasses
 * 2. Take topological sort of graph
 * 3. Starting at the superclasses in the sort, fill in the
 *    propertySets for each JsClass. For every subclass encountered,
 *    filter out its superclass properties to create the subclass's property
 *    set
 * 4. Use the propertySets to create a new list of JsClasses
 */
export function correctJsProperties( jsClasses: JsClass[] ): JsClass[] {
	const jsClassHierarchyGraph = new Graph();

	// First, add all nodes to the graph
	jsClasses.forEach( jsClass => {
		jsClassHierarchyGraph.setNode( jsClass.id, jsClass );
	} );

	// Second, connect the subclasses to superclasses in the graph
	jsClasses.forEach( jsClass => {
		if( jsClass.superclassId ) {
			jsClassHierarchyGraph.setEdge( jsClass.id, jsClass.superclassId );
		}
	} );

	// the topological sort is going to put superclasses later in the returned
	// array, so reverse it
	const superclassToSubclassOrder = alg.topsort( jsClassHierarchyGraph ).reverse();

	// Starting from superclass JsClass instances and walking down to subclass
	// JsClass instances, fill in the property sets. When a subclass is
	// encountered, take all of the properties that were used in that subclass,
	// minus the properties in its superclass, in order to determine the
	// subclass-specific properties
	superclassToSubclassOrder.forEach( jsClassId => {
		const jsClass = jsClassHierarchyGraph.node( jsClassId ) as JsClass;
		const subclassOnlyProperties = new Set<string>( jsClass.properties );

		const superclasses = getSuperclasses( jsClass );
		superclasses.forEach( ( superclass: JsClass ) => {
			// Filter out both properties and methods from each superclass
			superclass.members.forEach( ( superclassProp: string ) => {
				subclassOnlyProperties.delete( superclassProp );
			} );
		} );

		const newJsClass = new JsClass( {
			path: jsClass.path,
			name: jsClass.name,
			superclassName: jsClass.superclassName,
			superclassPath: jsClass.superclassPath,
			methods: jsClass.methods,
			properties: [ ...subclassOnlyProperties ]
		} );

		// Re-assign the new JsClass with the correct subclass properties back
		// to the graph for the next iteration, in case there is a subclass of
		// the current class which needs to read those properties
		jsClassHierarchyGraph.setNode( jsClassId, newJsClass );
	} );


	// Return all of the new JsClass instances with properties corrected for
	// superclass/subclasses
	return jsClassHierarchyGraph.nodes()
		.map( jsClassId => jsClassHierarchyGraph.node( jsClassId ) as JsClass );


	function getSuperclasses( jsClass: JsClass ) {
		const superclasses: JsClass[] = [];

		while( jsClass.superclassId ) {
			const superclass = jsClassHierarchyGraph.node( jsClass.superclassId ) as JsClass;
			superclasses.push( superclass );

			jsClass = superclass;
		}
		return superclasses;
	}
}