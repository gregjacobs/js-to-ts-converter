import { union } from "../util/set-utils";

/**
 * Represents a JavaScript class found in a source file.
 */
export class JsClass {
	public readonly path: string;
	public readonly name: string | undefined;             // will be undefined for a default export class
	public readonly superclassName: string | undefined;       // undefined if there is no superclass
	public readonly superclassPath: string | undefined;   // undefined if there is no superclass
	public readonly methods: Set<string>;
	public readonly properties: Set<string>;
	public readonly members: Set<string>;  // a union of the methods and properties Sets

	constructor( cfg: {
		path: string;
		name: string | undefined;
		superclassName: string | undefined;
		superclassPath: string | undefined;
		methods: Set<string>;
		properties: Set<string>;
	} ) {
		this.path = cfg.path;
		this.name = cfg.name;
		this.superclassName = cfg.superclassName;
		this.superclassPath = cfg.superclassPath;
		this.methods = cfg.methods;
		this.properties = cfg.properties;

		this.members = union( this.methods, this.properties );
	}

	/**
	 * String identifier for the JsClass which is a combination of its file path
	 * and class name. Used to store JsClass nodes on a graphlib Graph.
	 */
	public get id(): string {
		return `${this.path}_${this.name}`;
	}

	/**
	 * Retrieves the ID of the superclass JsClass instance, if the JsClass has
	 * one. If not, returns undefined.
	 */
	public get superclassId(): string | undefined {
		if( this.isSuperclassInNodeModules() ) {
			// If the superclass is in the node_modules folder, we'll
			// essentially treat this JsClass as if it didn't have a superclass.
			// See `isSuperclassInNodeModules()` jsdoc for details.
			return undefined;

		} else {
			return this.superclassName && `${this.superclassPath}_${this.superclassName}`;
		}
	}


	/**
	 * Determines if the JsClass's superclass was found in the node_modules
	 * directory (i.e. it extends from another package).
	 *
	 * If so, we're not going to try to understand a possibly ES5 module for
	 * its properties, so we'll just stop processing at that point.
	 */
	public isSuperclassInNodeModules(): boolean {
		return !!this.superclassPath && /[\\\/]node_modules[\\\/]/.test( this.superclassPath );
	}

}