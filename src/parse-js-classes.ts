import * as ts from 'typescript';
import Project, { ClassDeclaration, ImportDeclaration, ImportSpecifier, SourceFile } from "ts-simple-ast";
import { JsClass } from "./model/js-class";
import * as path from "path";

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
		const { superclass, superclassPath } = parseSuperclass( sourceFile, fileClass );
		const properties = parseProperties( fileClass );

		return new JsClass( {
			sourceFile,
			name: className,
			superclass,
			superclassPath,
			properties
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
	superclass: string | undefined;
	superclassPath: string | undefined;
} {
	let superclass: string | undefined;
	let superclassPath: string | undefined;

	const heritage = fileClass.getExtends();
	if( heritage ) {
		superclass = heritage.getExpression().getText();
		superclassPath = findImportPathForIdentifier( file, superclass ) || file.getFilePath();
	}

	return { superclass, superclassPath };
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
			return importDeclaration.getNamedImports()
				.map( ( namedImport: ImportSpecifier ) => namedImport.getName() )
				.includes( identifier );
		} );

	if( importWithIdentifier ) {
		const moduleSpecifier = importWithIdentifier.getModuleSpecifier().getLiteralValue();

		// Return absolute path to the module, based on the source file that the
		// import was found
		return path.resolve( sourceFile.getDirectory().getPath(), moduleSpecifier + '.js' );

	} else {
		return null;
	}
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
 *     [ 'something', 'something2', 'something3' ]
 */
function parseProperties( fileClass: ClassDeclaration ): string[] {
	const thisProps = fileClass
		.getDescendantsOfKind( ts.SyntaxKind.PropertyAccessExpression )
		.filter( prop => prop.getExpression().getKind() === ts.SyntaxKind.ThisKeyword );

	const propNames = thisProps.map( prop => prop.getName() );
	//console.log( propNames );

	return propNames;
}