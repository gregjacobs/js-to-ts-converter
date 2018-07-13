import * as path from "path";
import * as fs from 'fs';

import { convert } from "./converter/convert";
import { createTsAstProject } from "./create-ts-ast-project";
import Project from "ts-simple-ast";

const ArgumentParser = require('argparse').ArgumentParser;


const parser = new ArgumentParser( {
	version: require( '../package.json' ).version,
	addHelp: true,
	description: 'JS -> TS Converter'
} );
parser.addArgument( 'directory', {
	help: 'The directory of .js files to convert'
} );

const args = parser.parseArgs();
const absolutePath = path.resolve( args.directory );

if( !fs.lstatSync( absolutePath ).isDirectory() ) {
	console.error( `${absolutePath} is not a directory. Please provide a directory` );
	process.exit( 1 );
}

const tsAstProject = createTsAstProject( absolutePath );

// Print input files
console.log( 'Processing the following source files for JS classes:' );
printSourceFilesList( tsAstProject, '  ' );

// Convert
const convertedTsAstProject = convert( tsAstProject );

// Print output files
console.log( 'Outputting .ts files:' );
printSourceFilesList( convertedTsAstProject, '  ' );

// Save output files
convertedTsAstProject.saveSync();


function printSourceFilesList( astProject: Project, indent = '' ) {
	astProject.getSourceFiles().forEach( sf => {
		console.log( `${indent}${sf.getFilePath()}` );
	} );
}