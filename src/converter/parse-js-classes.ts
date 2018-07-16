import * as ts from 'typescript';
import Project, { ClassDeclaration, ClassInstancePropertyTypes, ImportDeclaration, ImportSpecifier, MethodDeclaration, PropertyAccessExpression, SourceFile } from "ts-simple-ast";
import { JsClass } from "../model/js-class";
import * as path from "path";
import { difference, union } from "../util/set-utils";

/**
 * Parses the classes out of each .js file in the SourceFilesCollection, and
 * forms a tree representing their hierarchy.
 *
 * ## Description of algorithm:
 *
 * Each source file is parsed to find all file-level classes. Their superclasses
 * and import paths for those superclasses are also recorded to form an
 * adjacency list graph of classes keyed by their file path.
 *
 * Each class is also processed to find and record any property accesses of the
 * `this` object. For instance, in the following class, there are 3
 * PropertyAccessExpressions that pull from the `this` object ('something1',
 * 'something2', and 'something3'):
 *
 *     class Something {
 *         constructor() {
 *             this.something1 = 1;
 *             this.something2 = 2;
 *         }
 *
 *         someMethod() {
 *             console.log( this.something3 );
 *
 *             console.log( window.location );  // <-- not a `this` PropertyAccessExpression
 *         }
 *     }
 *
 * The returned graph will be used later to determine which TS class property
 * definitions should be placed in superclasses vs. subclasses. Properties used
 * by a superclass and a subclass should only be defined in the superclass.
 */
export function parseJsClasses( tsAstProject: Project ): JsClass[] {
	const files = tsAstProject.getSourceFiles();

	const jsClasses = files.reduce( ( classes: JsClass[], file: SourceFile ) => {
		const fileClasses = parseFileClasses( file );
		return classes.concat( fileClasses );
	}, [] );

	return jsClasses;
}


/**
 * Parses the file-level classes out of the given `sourceFile`.
 */
function parseFileClasses( sourceFile: SourceFile ): JsClass[] {
	return sourceFile.getClasses().map( fileClass => {
		const className = fileClass.getName();
		const { superclassName, superclassPath } = parseSuperclass( sourceFile, fileClass );
		const methods = parseMethods( fileClass );

		const existingPropertyDeclarations = parsePropertyDeclarations( fileClass );  // in case we are actually parsing a TypeScript class with existing declarations
		const propertyAccesses = parsePropertyAccesses( fileClass );
		const combinedProperties = union( existingPropertyDeclarations, propertyAccesses );

		const propertiesWithoutMethods = difference( combinedProperties, methods );  // remove any method names from this Set

		return new JsClass( {
			path: sourceFile.getFilePath(),
			name: className,
			superclassName,
			superclassPath,
			methods,
			properties: propertiesWithoutMethods
		} );
	} );
}

/**
 * Given a file and ClassDeclaration, finds the name of the superclass and the
 * full path to the module (file) that hosts the superclass.
 *
 * `superclass` and `superclassPath` in the return object will be `null` if
 * there is no superclass.
 */
function parseSuperclass(
	file: SourceFile,
	fileClass: ClassDeclaration
): {
	superclassName: string | undefined;
	superclassPath: string | undefined;
} {
	let superclassName: string | undefined;
	let superclassPath: string | undefined;

	const heritage = fileClass.getExtends();
	if( heritage ) {
		superclassName = heritage.getExpression().getText();

		// Confirm that the superclass is an identifier rather than an
		// expression. It would be a bit much to try to understand expressions
		// as a class's 'extends', so just ignore these for now.
		// Example of ignored class extends:
		//
		//    class MyClass extends Mixin.mix( MixinClass1, MixinClass2 )
		//
		if( isValidIdentifier( superclassName ) ) {
			superclassPath = findImportPathForIdentifier( file, superclassName ) || file.getFilePath();
		} else {
			superclassName = undefined;
		}
	}

	return { superclassName, superclassPath };
}


/**
 * Helper to determine if a string of text is a valid JavaScript identifier.
 */
function isValidIdentifier( text: string ) {
	return /^[\w$]+$/.test( text );
}

/**
 * Finds the import path for the given `identifier`.
 *
 * For example, if we were looking for the identifier 'MyClass' in the following
 * list of imports:
 *
 *     import { Something } from './somewhere';
 *     import { MyClass } from './my-class';
 *
 * Then the method would return 'absolute/path/to/my-class.js';
 *
 * If there is no import for `identifier`, the method returns `null`.
 */
function findImportPathForIdentifier(
	sourceFile: SourceFile,
	identifier: string
): string | null {
	const importWithIdentifier = sourceFile
		.getImportDeclarations()
		.find( ( importDeclaration: ImportDeclaration ) => {
			const hasNamedImport = importDeclaration.getNamedImports()
				.map( ( namedImport: ImportSpecifier ) => namedImport.getName() )
				.includes( identifier );

			const defaultImport = importDeclaration.getDefaultImport();
			const hasDefaultImport = !!defaultImport && defaultImport.getText() === identifier;

			return hasNamedImport || hasDefaultImport;
		} );

	if( importWithIdentifier ) {
		const moduleSpecifier = importWithIdentifier.getModuleSpecifier().getLiteralValue();

		// Return absolute path to the module, based on the source file that the
		// import was found
		const importPath = path.resolve( sourceFile.getDirectory().getPath(), moduleSpecifier + '.js' );
		return importPath.replace( /\\/g, '/' );  // normalize to forward slashes for windows to be consistent with ts-simple-ast

	} else {
		return null;
	}
}


/**
 * Parses the method names from the class into a Set of strings.
 */
function parseMethods( fileClass: ClassDeclaration ): Set<string> {
	return fileClass.getMethods()
		.reduce( ( methods: Set<string>, method: MethodDeclaration ) => {
			return methods.add( method.getName() );
		}, new Set<string>() );
}


/**
 * In the case that the utility is actually parsing TypeScript classes with
 * existing property declarations, we want to know about these so we don't
 * accidentally write in new ones of the same name.
 */
function parsePropertyDeclarations( fileClass: ClassDeclaration ): Set<string> {
	return fileClass.getInstanceProperties()
		.reduce( ( props: Set<string>, prop: ClassInstancePropertyTypes ) => {
			const propName = prop.getName();
			return propName ? props.add( propName ) : props;  // don't add unnamed properties (not sure how we would have one of those, but seems its possible according to the TsSimpleAst types)
		}, new Set<string>() );
}


/**
 * Parses the property names of `this` PropertyAccessExpressions.
 *
 * Example:
 *
 *     this.something = 42;
 *     this.something2 = 43;
 *     console.log( this.something3 );
 *
 * Method returns:
 *
 *    Set( [ 'something', 'something2', 'something3' ] )
 */
function parsePropertyAccesses( fileClass: ClassDeclaration ): Set<string> {
	const thisProps = fileClass
		.getDescendantsOfKind( ts.SyntaxKind.PropertyAccessExpression )
		.filter( prop => prop.getExpression().getKind() === ts.SyntaxKind.ThisKeyword );

	const propNamesSet = thisProps
		.reduce( ( props: Set<string>, prop: PropertyAccessExpression ) => {
			return props.add( prop.getName() );
		}, new Set<string>() );

	return propNamesSet;
}