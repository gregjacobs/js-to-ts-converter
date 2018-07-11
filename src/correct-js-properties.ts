import { JsClass } from "./model/js-class";
import { Graph } from "graphlib";

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

	const correctedJsClasses = jsClasses.map( ( jsClass: JsClass ) => {


		return new JsClass( {
			sourceFile: jsClass.sourceFile,
			name: jsClass.name,
			superclass: jsClass.superclass,
			superclassPath: jsClass.superclassPath,
			properties: subclassOnlyProperties
		} );
	} );


	return correctedJsClasses;
}