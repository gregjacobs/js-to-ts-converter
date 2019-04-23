import { Project, ClassInstancePropertyTypes, PropertyDeclarationStructure, Scope } from "ts-morph";
import { parseJsClasses } from "./parse-js-classes";
import { correctJsProperties } from "./correct-js-properties";
import logger from "../../logger/logger";

/**
 * Parses all source files looking for ES6 classes, and takes any `this`
 * property access to create a PropertyDeclaration for the class.
 *
 * For example:
 *
 *     class Something {
 *         constructor() {
 *             this.someProp = 1;
 *         }
 *     }
 *
 * Is changed to:
 *
 *     class Something {
 *         someProp: any;
 *
 *         constructor() {
 *             this.someProp = 1;
 *         }
 *     }
 */
export function addClassPropertyDeclarations( tsAstProject: Project ): Project {
	// Parse the JS classes for all of the this.xyz properties that they use
	const jsClasses = parseJsClasses( tsAstProject );

	// Correct the JS classes' properties for superclass/subclass relationships
	// (essentially remove properties from subclasses that are defined by their
	// superclasses)
	const propertiesCorrectedJsClasses = correctJsProperties( jsClasses );

	// Fill in field definitions for each of the classes
	propertiesCorrectedJsClasses.forEach( jsClass => {
		const sourceFile = tsAstProject.getSourceFileOrThrow( jsClass.path );
		logger.verbose( `  Updating class '${jsClass.name}' in '${sourceFile.getFilePath()}'` );

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

		logger.verbose( `    Adding property declarations for properties: '${undeclaredProperties.join( "', '" )}'` );
		classDeclaration.insertProperties( 0, propertyDeclarations )
	} );

	return tsAstProject;
}