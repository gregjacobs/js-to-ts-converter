import { JsClass } from "./js-class";
import { Graph } from "graphlib";

// maps class name -> JsClass instance
// class name may be undefined for the default class of a file
type JsClassMap = Map<string | undefined, JsClass>;

/**
 *
 */
export class JsClassesGraph {
	public readonly jsClasses: ReadonlyArray<JsClass>

	private pathToClassMap = new Map<string, JsClassMap>();
	private jsClassGraph = new Graph();
	private propertySets = new Map<JsClass, Set<string>>();

	constructor(
		jsClasses: ReadonlyArray<JsClass>
	) {
		this.jsClasses = jsClasses;

		this.buildPathToClassMap( jsClasses );


		// TODO:
		//   1. Build graph
		//   2. Take topological sort of graph
		//   3. Starting at the superclasses in the sort, fill in the
		//      propertySets for each JsClass. For every subclass encountered,
		//      filter out its superclass properties to create its property
		//      set
		//   4. Use the propertySets to create a new list of JsClasses
		//
		//   TODO PART 2:
		//      We don't even need this class. The above algorithm can be
		//      implemented in correct-js-properties.ts. The parse-js-classes.ts
		//      file can simply return a list of the JsClasses
		//

		this.buildGraph();
	}


	private buildPathToClassMap( jsClasses: ReadonlyArray<JsClass> ) {
		jsClasses.forEach( jsClass => {
			const jsClassPath = jsClass.path;

			if( !this.pathToClassMap.has( jsClassPath ) ) {
				this.pathToClassMap.set( jsClassPath, new Map<string | undefined, JsClass>() );
			}

			this.pathToClassMap.get( jsClassPath )!.set( jsClass.name, jsClass );
		} );
	}


	private buildGraph() {

	}


	/**
	 * Determines if the superclass(es) of the given `jsClass` have the given
	 * `property` used in them.
	 */
	superclassHasProperty( jsClass: JsClass, property: string ) {

	}


	private getSuperclass( jsClass: JsClass ): JsClass | null {
		const { superclass: superclassName, superclassPath } = jsClass;

		if( typeof superclassPath === 'string' ) {
			const jsClassesForPathMap = this.pathToClassMap.get( superclassPath );

			if( jsClassesForPathMap ) {
				return jsClassesForPathMap.get( superclassName ) || null;
			}
		}
		return null;
	}

}