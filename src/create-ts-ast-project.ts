import Project, { IndentationText } from "ts-simple-ast";
const glob = require( 'glob-all' );

/**
 * Creates a ts-simple-ast Project by including the source files under the given
 * `directory`.
 *
 * @param directory The absolute path to the directory of .js files to
 *   include.
 * @param options
 * @param options.indentationText The text used to indent new class property
 *   declarations.
 * @param options.excludePatterns Glob patterns to exclude files.
 */
export function createTsAstProject( directory: string, options: {
	indentationText?: IndentationText,
	excludePatterns?: string[]
} = {} ) {
	const tsAstProject = new Project( {
		manipulationSettings: {
			indentationText: options.indentationText || IndentationText.Tab
		}
	} );

	// Do not include node_modules. We don't want to attempt to parse those as
	// they may be ES5, and we also don't accidentally want to write out into
	// the node_modules folder
	const filePatterns = [
		`${directory}/**/*.+(js|ts)`,
		`!${directory}/**/node_modules/**/*.+(js|ts)`
	];

	// Add any patterns to exclude
	( options.excludePatterns || [] ).forEach( pattern => {
		filePatterns.push( `!${directory}/${pattern}` );
	} );

	const files = glob.sync( filePatterns );
	files.forEach( ( filePath: string ) => {
		tsAstProject.addExistingSourceFile( filePath )
	} );

	return tsAstProject;
}