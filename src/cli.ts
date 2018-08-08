#!/usr/bin/env node

import * as path from "path";
import * as fs from 'fs';

import { IndentationText } from "ts-simple-ast";
import logger, { LogLevel, logLevels } from './logger';
import { convertJsToTsSync } from "./js-to-ts-converter";


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
parser.addArgument( '--exclude', {
	help: 'Glob patterns to exclude from being converted. Separate multiple patterns ' +
	      'with a comma. The patterns must be valid for the "glob-all" npm ' +
	      'package (https://www.npmjs.com/package/glob-all).\n' +
	      'Example: --exclude="**/myFolder/**,**/*.jsx"'
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
const absolutePath = path.resolve( args.directory.replace( /\/$/, '' ) );  // remove any trailing slash


if( !fs.lstatSync( absolutePath ).isDirectory() ) {
	logger.error( `${absolutePath} is not a directory. Please provide a directory` );
	process.exit( 1 );
} else {
	logger.info( `Processing directory: '${absolutePath}'` );
}


convertJsToTsSync( absolutePath, {
	indentationText: resolveIndentationText( args.indentation_text ),
	logLevel: resolveLogLevel( args.log_level ),
	excludePatterns: parseExcludePatterns( args.exclude )
} );


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


function parseExcludePatterns( excludePatterns: string | undefined ): string[] {
	if( !excludePatterns ) { return []; }

	return excludePatterns.split( ',' );
}