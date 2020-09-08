import { expect } from 'chai';
import { createTsMorphProject } from "../src/create-ts-morph-project";
import { convert } from "../src/converter/convert";
import { SourceFile } from "ts-morph";
import * as fs from "fs";
import logger from "../src/logger/logger";
import { JsToTsConverterOptions } from "../src";

// Minimal logging for tests
logger.setLogLevel( 'error' );

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


	it( `should not fill in property declarations for properties that are already
	     declared (such as if the utility is run against a typescript codebase),
	     but should fill in any missing properties that are not declared`,
	() => {
		runTest( `${__dirname}/fixture/typescript-class` );
	} );


	it( `should handle 'var this = that' by adding 'that.xyz' as a class
	     property declaration`,
	() => {
		runTest( `${__dirname}/fixture/function-expressions-and-declarations` );
	} );


	it( `should make function parameters optional when call sites are found to
	     supply fewer arguments than there are parameters`,
	() => {
		runTest( `${__dirname}/fixture/function-calls-with-fewer-args-than-params` );
	} );


	it( `should not require node_modules to be installed in order to convert a
	     codebase`,
	() => {
		runTest( `${__dirname}/fixture/superclass-subclass-node-modules-not-installed` );
	} );


	it( `should properly handle includePatterns and excludePatterns options`, () => {
		runTest( `${__dirname}/fixture/include-exclude-patterns`, {
			includePatterns: [ '**/included/**' ],
			excludePatterns: [ '**/included/excluded/**' ]
		} );
	} );

	it( `should properly convert a React .jsx file to .tsx`, () => {
		runTest( `${__dirname}/fixture/react-class-jsx` );
	} );

	it( `should properly convert a React .js file which has JSX within it
		 to .tsx`, 
	() => {
		runTest( `${__dirname}/fixture/react-class-js` );
	} );

	it( `should not do anything with a reference to this.constructor (https://github.com/gregjacobs/js-to-ts-converter/issues/9)`,
	() => {
		runTest( `${__dirname}/fixture/class-with-this-constructor-reference` );
	} );

	it( `should not error with a self-closing JSX element (https://github.com/gregjacobs/js-to-ts-converter/issues/4)`,
	() => {
		runTest( `${__dirname}/fixture/react-jsx-self-closing-element` );
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
 * @param absolutePath Absolute path to the directory which has
 *   `input` and `expected` subdirectories.
 * @param [inputFilesOptions] The options to configure the converter.
 */
function runTest(
	absolutePath: string,
	inputFilesOptions?: JsToTsConverterOptions
) {
	if( !fs.lstatSync( absolutePath ).isDirectory() ) {
		throw new Error( 'The absolute path: ' + absolutePath + ' is not a directory' );
	}
	if( !fs.lstatSync( absolutePath + '/input' ).isDirectory() ) {
		throw new Error( 'The absolute path: ' + absolutePath + '/input is not a directory' );
	}
	if( !fs.lstatSync( absolutePath + '/expected' ).isDirectory() ) {
		throw new Error( 'The absolute path: ' + absolutePath + '/expected is not a directory' );
	}

	const inputFilesProject = createTsMorphProject( absolutePath + '/input', inputFilesOptions );
	const expectedFilesProject = createTsMorphProject( absolutePath + '/expected' );

	if( inputFilesProject.getSourceFiles().length === 0 ) {
		throw new Error( `No source files were found in the input directory: ${absolutePath}/input` );
	}

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
