import { SourceFile } from "ts-simple-ast";

/**
 * Represents a JavaScript class found in a source file.
 */
export class JsClass {

	constructor(
		private sourceFile: SourceFile,
		public readonly properties: string[]
	) {}

}