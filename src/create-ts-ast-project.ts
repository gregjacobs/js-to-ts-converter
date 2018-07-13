import Project from "ts-simple-ast";

/**
 * Creates a ts-simple-ast Project by including the source files under the given
 * `directory`.
 *
 * @param directory The absolute path to the directory of .js files to
 *   include.
 */
export function createTsAstProject( directory: string ) {
	const tsAstProject = new Project();
	tsAstProject.addExistingSourceFiles( `${directory}/**/*.js` );

	return tsAstProject;
}