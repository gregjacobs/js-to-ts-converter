import Project, { PropertyDeclarationStructure, Scope } from "ts-simple-ast";
import { correctJsProperties } from "./correct-js-properties";
import { parseJsClasses } from "./parse-js-classes";

export function convert( tsAstProject: Project ): Project {
	// Parse the JS classes for all of the this.xyz properties that they use
	const jsClassesGraph = parseJsClasses( tsAstProject );

	// Correct the JS classes' properties for superclass/subclass relationships
	// (essentially remove properties from subclasses that are defined by their
	// superclasses)
	const propertiesCorrectedJsClasses = correctJsProperties( jsClassesGraph );

	// Fill in field definitions for each of the classes
	propertiesCorrectedJsClasses.forEach( jsClass => {
		const sourceFile = tsAstProject.getSourceFileOrThrow( jsClass.path );

		const classDeclaration = sourceFile.getClassOrThrow( jsClass.name! );
		const jsClassProperties = jsClass.properties;

		const propertyDeclarations = jsClassProperties.map( propertyName => {
			return {
				name: propertyName,
				type: 'any',
				scope: Scope.Public
			} as PropertyDeclarationStructure;
		} );

		classDeclaration.insertProperties( 0, propertyDeclarations )
	} );


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