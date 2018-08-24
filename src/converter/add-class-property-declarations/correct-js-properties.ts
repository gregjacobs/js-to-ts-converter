import { JsClass } from "./js-class";
import { Graph, alg } from "graphlib";
import logger from "../../logger/logger";

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
	logger.debug( 'Building graph of class hierarchy to determine which class properties belong to superclasses/subclasses' );

	const jsClassHierarchyGraph = new Graph();

	// First, add all nodes to the graph
	jsClasses.forEach( jsClass => {
		jsClassHierarchyGraph.setNode( jsClass.id, jsClass );
	} );

	// Second, connect the subclasses to superclasses in the graph
	jsClasses.forEach( jsClass => {
		if( jsClass.superclassId ) {
			// If we come across a JsClass whose superclass is in the node_modules
			// directory (i.e. imported from another package), do not try to
			// go into that package. We're not going to try to understand an ES5
			// module
			if( jsClass.isSuperclassInNodeModules() ) {
				return;
			}

			// As a bit of error checking, make sure that we're not going to
			// accidentally create a graph node by adding an edge to
			// jsClass.superclassId. This would happen if we didn't figure out
			// the correct path to the superclass in the parse phase, or we
			// didn't have the superclass's source file added to the project.
			if( !jsClassHierarchyGraph.hasNode( jsClass.superclassId ) ) {
				throw new Error( `
					An error occurred while adding property declarations to class
					'${jsClass.name}' in file:
					    '${jsClass.path}'
					
					Did not parse this class's superclass ('${jsClass.superclassName}') from file:
					    '${jsClass.superclassPath}'
					during the parse phase. 
					
					Make sure that this class's superclass's .js file is within the 
					directory passed to this conversion utility, or otherwise 
					there is a bug in this utility. Please report at:
					    https://github.com/gregjacobs/js-to-ts-converter/issues
					 
					Debugging info:
					
					This class's graph ID: ${jsClass.id}
					It's superclass's graph ID: ${jsClass.superclassId}
					
					Current IDs in the graph:
					    ${jsClassHierarchyGraph.nodes().join( '\n    ' )}
				`.replace( /^\t*/gm, '' ) );
			}

			jsClassHierarchyGraph.setEdge( jsClass.id, jsClass.superclassId );
		}
	} );

	// the topological sort is going to put superclasses later in the returned
	// array, so reverse it
	logger.debug( 'Topologically sorting the graph in superclass->subclass order' );
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
			properties: subclassOnlyProperties
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