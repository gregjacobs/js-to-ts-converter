#!/usr/bin/env node

import * as path from "path";
import * as fs from 'fs';

import { convert } from "./converter/convert";
import { createTsAstProject } from "./create-ts-ast-project";
import Project, { IndentationText } from "ts-simple-ast";
import logger, { LogLevel, logLevels } from './logger';


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
parser.addArgument( '--log-level', {
	help: `
		The level of logs to print to the console. From highest amount of \
		logging to lowest amount of logging: '${logLevels.join("', '")}' 
		Defaults to verbose to tell you what's going on, as the script may take
		a long time to complete when looking up usages of functions. Use 'debug'
		to enable even more logging.
	`.trim().replace( /^\t*/gm, '' ),
	choices: logLevels,
	defaultValue: 'verbose'
} );

const args = parser.parseArgs();
const absolutePath = path.resolve( args.directory );

logger.setLogLevel( resolveLogLevel( args.logLevel ) );

if( !fs.lstatSync( absolutePath ).isDirectory() ) {
	logger.error( `${absolutePath} is not a directory. Please provide a directory` );
	process.exit( 1 );
} else {
	logger.info( `Processing directory: '${absolutePath}'` );
}

const tsAstProject = createTsAstProject( absolutePath, {
	indentationText: resolveIndentationText( args.indentationText )
} );

// Print input files
logger.log( 'Processing the following source files:' );
printSourceFilesList( tsAstProject, '  ' );

// Convert
logger.log( 'Converting source files. This may take anywhere from a few minutes to tens of minutes or longer depending on how many files are being converted due to the use of the TypeScript language service to look up function references...' );
const convertedTsAstProject = convert( tsAstProject );

// Print output files
logger.log( 'Outputting .ts files:' );
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


function resolveLogLevel( logLevelStr: string ): LogLevel {
	if( !logLevels.includes( logLevelStr ) ) {
		throw new Error( `
			Unknown --log-level argument '${logLevelStr}'
			Must be one of: '${logLevels.join( "', '" )}'
		`.trim().replace( /\t*/gm, '' ) );
	}

	return logLevelStr as LogLevel;
}

/**
 * Private helper to print out the source files list in the given `astProject`
 * to the console.
 */
function printSourceFilesList( astProject: Project, indent = '' ) {
	astProject.getSourceFiles().forEach( sf => {
		logger.log( `${indent}${sf.getFilePath()}` );
	} );
}