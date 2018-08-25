import { union } from "../../util/set-utils";

/**
 * Represents a JavaScript class found in a source file.
 */
export class JsClass {
	/**
	 * The name of the class.
	 *
	 * Will be undefined for a default export class.
	 */
	public readonly name: string | undefined;

	/**
	 * The absolute path of the file that the class was found in.
	 *
	 * Will be `undefined` if the class was found in the node_modules folder. We
	 * don't try to resolve the path of a module that exists in the node_modules
	 * folder as they're not relevant to this conversion utility, and we want to
	 * allow conversions of codebases that don't have node_modules installed
	 * (which can really improve performance as ts-simple-ast doesn't try to
	 * resolve them when it finds imports in .ts files)
	 */
	public readonly path: string | undefined;

	/**
	 * The name of this class's superclass. Will be `undefined` if the class
	 * does not have a superclass.
	 */
	public readonly superclassName: string | undefined;

	/**
	 * The path to the file which holds this class's superclass. If the same
	 * file that holds this class also holds its superclass, this will be the
	 * same value as the {@link #path}.
	 *
	 * Will be `undefined` if the superclass was found in the node_modules
	 * folder. See node in {@link #path} about this.
	 */
	public readonly superclassPath: string | undefined;

	/**
	 * The set of methods found in the class.
	 */
	public readonly methods: Set<string>;

	/**
	 * The set of properties found to be used in the class. These are inferred
	 * from usages. For example: console.log(this.something) would tell us that
	 * the class has a property `something`
	 */
	public readonly properties: Set<string>;

	/**
	 * A union of the {@link #methods} and {@link #properties} sets
	 */
	public readonly members: Set<string>;

	constructor( cfg: {
		name: string | undefined;
		path: string | undefined;
		superclassName: string | undefined,
		superclassPath: string | undefined,
		methods?: Set<string>;
		properties?: Set<string>;
	} ) {
		this.name = cfg.name;
		this.path = cfg.path;
		this.superclassName = cfg.superclassName;
		this.superclassPath = cfg.superclassPath;
		this.methods = cfg.methods || new Set<string>();
		this.properties = cfg.properties || new Set<string>();

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
	 *
	 * Also returns `undefined` if the class is found to be in the node_modules
	 * folder, as we don't want to attempt to parse ES5 modules.
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
		return this.superclassPath === undefined;
	}

}