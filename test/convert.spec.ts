import { expect } from 'chai';
import { createTsAstProject } from "../src/create-ts-ast-project";
import { convert } from "../src/converter/convert";
import * as fs from 'fs';
import { SourceFile } from "ts-simple-ast";

describe( 'convert()', () => {

	it( `should convert JS classes to TS-compilable classes by filling in field
	     (property) declarations for properties consumed in the original JS 
	     classes`,
	() => {
		runTest( `${__dirname}/fixture/superclass-subclass` );
	} );

	it( `should ignore expressions (i.e. non-identifiers) in the 'extends' 
	     clause of a class (at least for the moment, this would be too much
	     to parse and figure out - may support in the future)`,
	() => {
		runTest( `${__dirname}/fixture/expression-extends` );
	} );

} );


/**
 * Runs a test of the conversion utility by passing it a directory that has
 * two subdirectories:
 *
 * - input
 * - expected
 *
 * The `input` directory will be converted, and then compared to the
 * `expected` directory.
 *
 * @param {string} absolutePath Absolute path to the directory which has
 *   `input` and `expected` subdirectories.
 */
function runTest( absolutePath: string ) {
	const inputFilesProject = createTsAstProject( absolutePath + '/input' );
	const expectedFilesProject = createTsAstProject( absolutePath + '/expected' );

	const convertedInputProject = convert( inputFilesProject );

	const convertedSourceFiles = convertedInputProject.getSourceFiles();
	const expectedSourceFiles = expectedFilesProject.getSourceFiles();
	const convertedSourceFilePaths = convertedInputProject.getSourceFiles().map( sf => sf.getFilePath() );
	const expectedSourceFilePaths = expectedFilesProject.getSourceFiles().map( sf => sf.getFilePath() );

	// First, make sure that there are the same number of files in the converted
	// and expected projects
	if( convertedSourceFiles.length !== expectedSourceFiles.length ) {
		throw new Error( `
			The number of converted source files (${convertedSourceFiles.length})
			does not match the number of expected source files (${expectedSourceFiles.length}).
			
			Converted source files:
			  ${convertedSourceFilePaths.join( '\n  ' )}
			  
			Expected source files:
			  ${expectedSourceFilePaths.join( '\n  ' )}
		`.replace( /^\t*/gm, '' ) )
	}

	// Now check each converted source file against the expected output file
	convertedSourceFiles.forEach( ( convertedSourceFile: SourceFile ) => {
		const expectedSourceFilePath = convertedSourceFile.getFilePath().replace( /([\\\/])input[\\\/]/, '$1expected$1' );
		const expectedSourceFile = expectedFilesProject.getSourceFile( expectedSourceFilePath );

		if( !expectedSourceFile ) {
			throw new Error( `
				The converted source file (below) does not have a matching 'expected' file: 
				  '${convertedSourceFile.getFilePath()}'
				  
				Tried to find matching expected file: 
				  '${expectedSourceFilePath}'
			`.replace( /^\t*/gm, '' ) );
		}

		expect( convertedSourceFile.getFullText() )
			.to.equal( expectedSourceFile!.getFullText() );
	} );


}
