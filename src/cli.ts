#!/usr/bin/env node

import * as path from "path";
import * as fs from 'fs';

import { convert } from "./converter/convert";
import { createTsAstProject } from "./create-ts-ast-project";
import Project, { IndentationText } from "ts-simple-ast";

const ArgumentParser = require('argparse').ArgumentParser;


const parser = new ArgumentParser( {
	version: require( '../package.json' ).version,
	addHelp: true,
	description: 'JS -> TS Converter'
} );
parser.addArgument( 'directory', {
	help: 'The directory of .js files to convert'
} );
parser.addArgument( '--indentation-text', {
	help: 'How you would like new code to be indented',
	choices: [ 'tab', 'twospaces', 'fourspaces', 'eightspaces' ],
	defaultValue: 'tab'
} );

const args = parser.parseArgs();
const absolutePath = path.resolve( args.directory );

if( !fs.lstatSync( absolutePath ).isDirectory() ) {
	console.error( `${absolutePath} is not a directory. Please provide a directory` );
	process.exit( 1 );
}

const tsAstProject = createTsAstProject( absolutePath, {
	indentationText: resolveIndentationText( args.indentationText )
} );

// Print input files
console.log( 'Processing the following source files:' );
printSourceFilesList( tsAstProject, '  ' );

// Convert
console.log( 'Converting source files. This may take a few minutes depending on how many files are being converted...' );
const convertedTsAstProject = convert( tsAstProject );

// Print output files
console.log( 'Outputting .ts files:' );
printSourceFilesList( convertedTsAstProject, '  ' );

// Save output files
convertedTsAstProject.saveSync();


/**
 * Private helper to resolve the correct IndentationText enum from the CLI
 * 'indentation' argument.
 */
function resolveIndentationText( indentationText: 'tab' | 'twospaces' | 'fourspaces' | 'eightspaces' ) {
	switch( indentationText ) {
		case 'tab'         : return IndentationText.Tab;
		case 'twospaces'   : return IndentationText.TwoSpaces;
		case 'fourspaces'  : return IndentationText.FourSpaces;
		case 'eightspaces' : return IndentationText.EightSpaces;

		default : return IndentationText.Tab;
	}
}

/**
 * Private helper to print out the source files list in the given `astProject`
 * to the console.
 */
function printSourceFilesList( astProject: Project, indent = '' ) {
	astProject.getSourceFiles().forEach( sf => {
		console.log( `${indent}${sf.getFilePath()}` );
	} );
}