import { SourceFile } from "ts-simple-ast";

/**
 * Represents a JavaScript class found in a source file.
 */
export class JsClass {
	public readonly sourceFile: SourceFile;
	public readonly name: string | undefined;             // will be undefined for a default export class
	public readonly superclass: string | undefined;       // undefined if there is no superclass
	public readonly superclassPath: string | undefined;   // undefined if there is no superclass
	public readonly properties: string[];

	constructor( cfg: {
		sourceFile: SourceFile;
		name: string | undefined;
		superclass: string | undefined;
		superclassPath: string | undefined;
		properties: string[];
	} ) {
		this.sourceFile = cfg.sourceFile;
		this.name = cfg.name;
		this.superclass = cfg.superclass;
		this.superclassPath = cfg.superclassPath;
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
		return this.superclass && `${this.superclassPath}_${this.superclass}`;
	}

	public get path(): string {
		return this.sourceFile.getFilePath();
	}


}