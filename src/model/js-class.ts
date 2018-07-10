import { SourceFile } from "ts-simple-ast";

/**
 * Represents a JavaScript class found in a source file.
 */
export class JsClass {

	constructor(
		private sourceFile: SourceFile,
		public readonly name: string | undefined,  // will be undefined for a default export class
		public readonly properties: string[]
	) {}

}