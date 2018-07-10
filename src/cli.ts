import * as path from "path";
import * as fs from 'fs';

import { readJsFiles } from "./read-js-files";

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

console.log( 'absolute path', absolutePath );


if( !fs.lstatSync( absolutePath ).isDirectory() ) {
	console.error( `${absolutePath} is not a directory. Please provide a directory` );
	process.exit( 1 );
}


// 1. Read all .js files, storing path and text
// 2. Parse all .js files for ES6 classes. Create tree (or graph) of JsClass
//    nodes
// 3. Walk down tree, and replace source text of classes with field-added
//    versions
// 4. Write out all .js files as .ts files
// 5. Delete all .js files

readJsFiles( absolutePath )
	.then( sourceFilesCollection => console.log( sourceFilesCollection ) )
	.catch( err => {
		console.error( "An error occurred: ", err );
		process.exit( 1 );
	} );