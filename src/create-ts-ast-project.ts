import Project, { IndentationText } from "ts-simple-ast";

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
	tsAstProject.addExistingSourceFiles( `${directory}/**/*.(js|ts)` );

	return tsAstProject;
}