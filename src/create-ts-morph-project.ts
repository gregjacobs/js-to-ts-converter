import { Project, IndentationText } from "ts-morph";
import * as fs from "fs";
const Minimatch = require( 'minimatch' ).Minimatch;
const glob = require( 'glob-all' );

/**
 * Creates a ts-morph Project by including the source files under the given
 * `directory`.
 *
 * @param directory The absolute path to the directory of .js files to
 *   include.
 * @param options
 * @param options.indentationText The text used to indent new class property
 *   declarations.
 * @param options.excludePatterns Glob patterns to exclude files.
 */
export function createTsMorphProject( directory: string, options: {
	indentationText?: IndentationText,
	includePatterns?: string[],
	excludePatterns?: string[]
} = {} ) {
	const tsMorphProject = new Project( {
		manipulationSettings: {
			indentationText: options.indentationText || IndentationText.Tab
		}
	} );

	// Get all files, and then filter. Was using glob-all and passing all of the
	// globs to the utility, but it takes way too long on large projects because
	// it seems to read the file system multiple times - once for each pattern.
	let files = glob.sync( `${directory}/**/*.+(js|ts|jsx|tsx)`, {
		follow: true   // follow symlinks
	} );

	// First, filter out any path which includes node_modules. We don't want to
	// attempt to parse those as they may be ES5, and we also don't accidentally
	// want to write out into the node_modules folder
	const nodeModulesRegex = /[\\\/]node_modules[\\\/]/;
	files = files.filter( ( file: string ) => !nodeModulesRegex.test( file ) );

	let includeMinimatches = createIncludeMinimatches( directory, options.includePatterns );
	let excludeMinimatches = createExcludeMinimatches( directory, options.excludePatterns );

	let includedFiles = files
		.filter( ( filePath: string ) => {
			return includeMinimatches.some( minimatch => minimatch.match( filePath ) );
		} )
		.filter( ( filePath: string ) => {
			return !excludeMinimatches.some( minimatch => minimatch.match( filePath ) );
		} )
		.filter( ( filePath: string ) => fs.statSync( filePath ).isFile() );  // don't take directories

	includedFiles.forEach( ( filePath: string ) => {
		tsMorphProject.addSourceFileAtPath( filePath )
	} );

	return tsMorphProject;
}


function createIncludeMinimatches(
	directory: string,
	includePatterns: string[] | undefined
) {
	return ( includePatterns || [ '**/*.+(js|ts|jsx|tsx)' ] )
		.map( pattern => `${directory}/${pattern}` )
		.map( pattern => new Minimatch( pattern ) );
}


function createExcludeMinimatches(
	directory: string,
	excludePatterns: string[] | undefined
) {
	return ( excludePatterns || [] )
		.map( pattern => `${directory}/${pattern}` )
		.map( pattern => new Minimatch( pattern ) );
}

