import * as glob from 'glob';
import { SourceFilesCollection } from "./source-files-collection";

const vinylFile = require( 'vinyl-file' );

/**
 * Reads all of the JS files in a directory.
 *
 * @param directory The absolute path to the directory to search for .js files
 *   under.
 */
export function readJsFiles( directory: string ): Promise<SourceFilesCollection> {
	const tsFiles = glob.sync( `${directory}/**/*.js` );
	const readPromises = tsFiles.map( path => vinylFile.read( path ) );

	return Promise.all( readPromises )
		.then( files => new SourceFilesCollection( files ) );
}