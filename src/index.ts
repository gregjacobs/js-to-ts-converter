import * as path from 'path';
import { createTsAstProject } from "./create-ts-ast-project";
import { convert } from "./converter/convert";
import Project from "ts-simple-ast";

/**
 * Asynchronously converts the JavaScript files under the given `sourceFilesPath`
 * to TypeScript files.
 */
export async function convertJsToTs( sourceFilesPath: string ): Promise<void> {
	const convertedTsAstProject = doConvert( sourceFilesPath );

	// Save output files
	return convertedTsAstProject.save();
}

/**
 * Synchronously converts the JavaScript files under the given `sourceFilesPath`
 * to TypeScript files.
 */
export function convertJsToTsSync( sourceFilesPath: string ) {
	const convertedTsAstProject = doConvert( sourceFilesPath );

	// Save output files
	convertedTsAstProject.saveSync();
}


/**
 * Performs the actual conversion given a `sourceFilesPath`, and returning a
 * `ts-simple-ast` Project with the converted source files.
 */
function doConvert( sourceFilesPath: string ): Project {
	const absolutePath = path.resolve( sourceFilesPath );

	const tsAstProject = createTsAstProject( absolutePath );
	return convert( tsAstProject );
}