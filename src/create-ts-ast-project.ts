import Project, { IndentationText } from "ts-simple-ast";
const glob = require( 'glob-all' );

/**
 * Creates a ts-simple-ast Project by including the source files under the given
 * `directory`.
 *
 * @param directory The absolute path to the directory of .js files to
 *   include.
 * @param options
 */
export function createTsAstProject( directory: string, options: {
	indentationText?: IndentationText
} = {} ) {
	const tsAstProject = new Project( {
		manipulationSettings: {
			indentationText: options.indentationText || IndentationText.Tab
		}
	} );

	const files = glob.sync( [
		`${directory}/**/*.(js|ts)`,
		`!node_modules/**/*`
	] );
	files.forEach( ( filePath: string ) => {
		tsAstProject.addExistingSourceFile( filePath )
	} );

	return tsAstProject;
}