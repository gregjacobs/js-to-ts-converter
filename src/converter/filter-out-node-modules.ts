import Project from "ts-simple-ast";

/**
 * Given a Project, removes all files that are under the node_modules folder.
 *
 * It seems the language service can pull in some .d.ts files from node_modules
 * that we don't want to be output after we save.
 */
export function filterOutNodeModules( tsAstProject: Project ): Project {
	tsAstProject.getSourceFiles().forEach( sourceFile => {
		if( sourceFile.getFilePath().includes( 'node_modules' ) ) {
			tsAstProject.removeSourceFile( sourceFile );
		}
	} );

	return tsAstProject;
}