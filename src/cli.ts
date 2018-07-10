import * as path from "path";
import * as fs from 'fs';
import * as util from "util";

import Project from "ts-simple-ast";
import { parseClasses } from "./parse-classes";

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


// 1. Read all .js files, storing path and text
// 2. Parse all .js files for ES6 classes. Create tree (or graph) of JsClass
//    nodes, which each hold a set of the properties used in the class, and
//    a reference to its parent in order to not re-declare the same fields as
//    the parent.
// 3. Go through each source file again, replace source text of classes with
//    field-added versions
// 4. Write out all .js files as .ts files
// 5. Delete all .js files

const tsAstProject = new Project();
tsAstProject.addExistingSourceFiles( `${absolutePath}/**/*.js` );

const sourceFiles = tsAstProject.getSourceFiles();
//console.log( sourceFiles );

const classesCollection = parseClasses( tsAstProject );
//console.log( util.inspect( classesCollection, { depth: 4 } ) );

