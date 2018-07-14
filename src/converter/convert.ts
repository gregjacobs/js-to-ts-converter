import Project, { ClassInstancePropertyTypes, PropertyDeclaration, PropertyDeclarationStructure, Scope } from "ts-simple-ast";
import { correctJsProperties } from "./correct-js-properties";
import { parseJsClasses } from "./parse-js-classes";

export function convert( tsAstProject: Project ): Project {
	// Parse the JS classes for all of the this.xyz properties that they use
	const jsClasses = parseJsClasses( tsAstProject );

	// Correct the JS classes' properties for superclass/subclass relationships
	// (essentially remove properties from subclasses that are defined by their
	// superclasses)
	const propertiesCorrectedJsClasses = correctJsProperties( jsClasses );

	// Fill in field definitions for each of the classes
	propertiesCorrectedJsClasses.forEach( jsClass => {
		const sourceFile = tsAstProject.getSourceFileOrThrow( jsClass.path );

		const classDeclaration = sourceFile.getClassOrThrow( jsClass.name! );
		const jsClassProperties = jsClass.properties;

		// If the utility was run against a TypeScript codebase, we should not
		// fill in property declarations for properties that are already
		// declared in the class. However, we *should* fill in any missing
		// declarations. Removing any already-declared declarations from the
		// jsClassProperties.
		const currentPropertyDeclarations = classDeclaration.getInstanceProperties()
			.reduce( ( props: Set<string>, prop: ClassInstancePropertyTypes ) => {
				const propName = prop.getName();
				return propName ? props.add( propName ) : props;
			}, new Set<string>() );

		const undeclaredProperties = [ ...jsClassProperties ]
			.filter( ( propName: string ) => !currentPropertyDeclarations.has( propName ) );

		// Add all currently-undeclared properties
		const propertyDeclarations = undeclaredProperties.map( propertyName => {
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