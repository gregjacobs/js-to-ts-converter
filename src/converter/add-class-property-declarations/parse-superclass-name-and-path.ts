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

		} else if( !!file.getClass( superclassName ) ) {
			superclassPath = file.getFilePath();

		} else {
			superclassPath = findImportPathForIdentifier( file, superclassName );
		}
	}

	return {
		superclassName,
		superclassPath: superclassPath && superclassPath.replace( /\\/g, '/' )  // normalize backslashes on Windows to forward slashes so we can compare directories with the paths that ts-simple-ast produces
	};
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
): string | undefined {
	const importWithIdentifier = findImportForIdentifier( sourceFile, identifier );

	if( importWithIdentifier ) {
		const moduleSpecifier = importWithIdentifier.getModuleSpecifier().getLiteralValue();

		if( !moduleSpecifier.startsWith( '.' ) ) {
			// if the import path isn't relative (i.e. doesn't start with './'
			// or '../'), then it must be in node_modules. Return `undefined` to
			// represent that. We don't want to parse node_modules, and we
			// should be able to migrate the codebase without node_modules even
			// being installed.
			return undefined;
		}

		// If it's a relative import, return the absolute path to the module,
		// based on the source file that the import was found
		const basedir = sourceFile.getDirectoryPath();
		try {
			return resolve.sync( moduleSpecifier, { basedir } );

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

	// Nothing found, return undefined
	return undefined;
}


