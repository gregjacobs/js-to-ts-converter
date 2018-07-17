import Project from "ts-simple-ast";
import { addClassPropertyDeclarations } from "./add-class-property-declarations/add-class-property-declarations";

/**
 * Converts the source .js code to .ts
 */
export function convert( tsAstProject: Project ): Project {
	// Fill in PropertyDeclarations for properties used by ES6 classes
	tsAstProject = addClassPropertyDeclarations( tsAstProject );

	// Rename .js files to .ts files
	tsAstProject.getSourceFiles().forEach( sourceFile => {
		const dir = sourceFile.getDirectoryPath();
		const basename = sourceFile.getBaseNameWithoutExtension();
		sourceFile.move( `${dir}/${basename}.ts` );
	} );

	// Filter out any node_modules files that accidentally got included by an import.
	// We don't want to modify these when we save the project
	tsAstProject.getSourceFiles().forEach( sourceFile => {
		if( sourceFile.getFilePath().includes( 'node_modules' ) ) {
			tsAstProject.removeSourceFile( sourceFile );
		}
	} );

	// Even though the `tsAstProject` has been mutated (it is not an immutable
	// data structure), return it anyway to avoid the confusion of an output
	// parameter.
	return tsAstProject;
}