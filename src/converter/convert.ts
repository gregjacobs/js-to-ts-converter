import Project from "ts-simple-ast";
import { addClassPropertyDeclarations } from "./add-class-property-declarations/add-class-property-declarations";
import { addOptionalsToFunctionParams } from "./add-optionals-to-function-params";
import { filterOutNodeModules } from "./filter-out-node-modules";

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
	tsAstProject = filterOutNodeModules( tsAstProject );

	// Make function parameters optional for calls that supply fewer arguments
	// than there are function parameters.
	// NOTE: Must happen after .js -> .ts rename for the TypeScript Language
	// Service to work.
	tsAstProject = addOptionalsToFunctionParams( tsAstProject );

	// For some reason, we need to filter out node_modules again due to some
	// .d.ts files that can be added by the language service. We don't want to
	// save these
	tsAstProject = filterOutNodeModules( tsAstProject );

	// Even though the `tsAstProject` has been mutated (it is not an immutable
	// data structure), return it anyway to avoid the confusion of an output
	// parameter.
	return tsAstProject;
}