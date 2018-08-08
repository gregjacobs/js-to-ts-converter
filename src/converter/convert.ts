import Project from "ts-simple-ast";
import { addClassPropertyDeclarations } from "./add-class-property-declarations/add-class-property-declarations";
import { addOptionalsToFunctionParams } from "./add-optionals-to-function-params";
import { filterOutNodeModules } from "./filter-out-node-modules";
import logger from "../logger/logger";

/**
 * Converts the source .js code to .ts
 */
export function convert( tsAstProject: Project ): Project {
	if( tsAstProject.getSourceFiles().length === 0 ) {
		logger.info( 'Found no source files to process. Exiting.' );
		return tsAstProject;
	}

	// Print input files
	logger.info( 'Processing the following source files:' );
	printSourceFilesList( tsAstProject, '  ' );

	logger.info( `
		Converting source files... This may take anywhere from a few minutes to 
		tens of minutes or longer depending on how many files are being 
		converted.
	`.replace( /\t*/gm, '' ) );

	// Fill in PropertyDeclarations for properties used by ES6 classes
	logger.info( 'Adding property declarations to JS Classes...' );
	tsAstProject = addClassPropertyDeclarations( tsAstProject );

	// Rename .js files to .ts files
	logger.info( 'Renaming .js files to .ts' );
	tsAstProject.getSourceFiles().forEach( sourceFile => {
		const dir = sourceFile.getDirectoryPath();
		const basename = sourceFile.getBaseNameWithoutExtension();

		sourceFile.move( `${dir}/${basename}.ts` );
	} );

	// Filter out any node_modules files that accidentally got included by an import.
	// We don't want to modify these when we save the project
	tsAstProject = filterOutNodeModules( tsAstProject );

	// Make function parameters optional for calls that supply fewer arguments
	// than there are function parameters.
	// NOTE: Must happen after .js -> .ts rename for the TypeScript Language
	// Service to work.
	logger.info( 'Making parameters optional for calls that supply fewer args than function parameters...' );
	tsAstProject = addOptionalsToFunctionParams( tsAstProject );

	// Filter out any node_modules files as we don't want to modify these when
	// we save the project. Also, some .d.ts files get included for some reason
	// like tslib.d.ts, so we don't want to output that as well.
	tsAstProject = filterOutNodeModules( tsAstProject );

	// Print output files
	logger.info( 'Outputting .ts files:' );
	printSourceFilesList( tsAstProject, '  ' );

	// Even though the `tsAstProject` has been mutated (it is not an immutable
	// data structure), return it anyway to avoid the confusion of an output
	// parameter.
	return tsAstProject;
}


/**
 * Private helper to print out the source files list in the given `astProject`
 * to the console.
 */
function printSourceFilesList( astProject: Project, indent = '' ) {
	astProject.getSourceFiles().forEach( sf => {
		logger.info( `${indent}${sf.getFilePath()}` );
	} );
}