import * as _ from 'lodash';

/**
 * Represents a JavaScript class found in a source file.
 */
export class JsClass {
	public readonly path: string;
	public readonly name: string | undefined;             // will be undefined for a default export class
	public readonly superclassName: string | undefined;       // undefined if there is no superclass
	public readonly superclassPath: string | undefined;   // undefined if there is no superclass
	public readonly methods: string[];
	public readonly properties: string[];

	constructor( cfg: {
		path: string;
		name: string | undefined;
		superclassName: string | undefined;
		superclassPath: string | undefined;
		methods: string[];
		properties: string[];
	} ) {
		this.path = cfg.path;
		this.name = cfg.name;
		this.superclassName = cfg.superclassName;
		this.superclassPath = cfg.superclassPath;
		this.methods = cfg.methods;
		this.properties = cfg.properties;
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
		return this.superclassName && `${this.superclassPath}_${this.superclassName}`;
	}


	/**
	 * Retrieves the array of all member names: both properties and methods.
	 */
	public get members(): string[] {
		return _.uniq( this.methods.concat( this.properties ) );
	}

}