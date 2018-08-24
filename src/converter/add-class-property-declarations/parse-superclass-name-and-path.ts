import { isValidIdentifier } from "../../util/is-valid-identifier";
import { ClassDeclaration, SourceFile } from "ts-simple-ast";
import { findImportForIdentifier } from "../../util/find-import-for-identifier";
const resolve = require( 'resolve' );
const TraceError = require( 'trace-error' );

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
		if( !isValidIdentifier( superclassName ) ) {
			superclassName = undefined;  // superclass was not a valid identifier
		} else {
			superclassPath = findImportPathForIdentifier( file, superclassName ) || file.getFilePath();
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
	const importWithIdentifier = findImportForIdentifier( sourceFile, identifier );

	if( importWithIdentifier ) {
		const moduleSpecifier = importWithIdentifier.getModuleSpecifier().getLiteralValue();
		const basedir = sourceFile.getDirectoryPath();

		// Return absolute path to the module, based on the source file that the
		// import was found
		try {
			return resolve.sync( moduleSpecifier, { basedir } )
				.replace( /\\/g, '/' );  // normalize backslashes on Windows to forward slashes so we can compare directories with the paths that ts-simple-ast produces

		} catch( error ) {
			throw new TraceError( `
				An error occurred while trying to resolve the absolute path to
				the import of identifier '${identifier}' in source file:
				    '${sourceFile.getFilePath()}'
				    
				Was looking at the import with text:
				    ${importWithIdentifier.getText()}   
			`.trim().replace( /^\t*/gm, '' ), error );
		}
	}

	// Nothing found, return null
	return null;
}


