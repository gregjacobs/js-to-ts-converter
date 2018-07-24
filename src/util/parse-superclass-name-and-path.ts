import * as path from "path";
import { isValidIdentifier } from "./is-valid-identifier";
import { ClassDeclaration, ImportDeclaration, ImportSpecifier, SourceFile } from "ts-simple-ast";

/**
 * Given a file and ClassDeclaration, finds the name of the superclass and the
 * full path to the module (file) that hosts the superclass.
 *
 * `superclass` and `superclassPath` in the return object will be `null` if
 * there is no superclass.
 */
export function parseSuperclassNameAndPath(
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
		const moduleSpecifierFile = importWithIdentifier.getModuleSpecifierSourceFile();
		if( moduleSpecifierFile ) {
			const importPath = moduleSpecifierFile.getFilePath();

			// don't include a superclass in node_modules
			if( !/[\\\/]node_modules[\\\/]/.test( importPath ) ) {
				return importPath.replace( /\\/g, '/' );  // normalize to forward slashes for windows to be consistent with ts-simple-ast
			}
		}
	}

	// Nothing found, return null
	return null;
}