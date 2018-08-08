import * as path from 'path';
import { createTsAstProject } from "./create-ts-ast-project";
import { convert } from "./converter/convert";
import Project, { IndentationText } from "ts-simple-ast";
import { LogLevel } from "./logger";
import logger from "./logger/logger";

/**
 * Asynchronously converts the JavaScript files under the given `sourceFilesPath`
 * to TypeScript files.
 *
 * @param sourceFilesPath The path to the source files to convert
 * @param options
 * @param options.indentationText The text used to indent new class property
 *   declarations.
 * @param options.logLevel The level of logging to show on the console.
 *   One of: 'debug', 'verbose', 'info', 'warn', 'error'
 * @param options.excludePatterns Glob patterns to exclude files.
 */
export async function convertJsToTs( sourceFilesPath: string, options: {
	indentationText?: IndentationText,
	logLevel?: LogLevel,
	excludePatterns?: string[]
} = {} ): Promise<void> {
	const convertedTsAstProject = doConvert( sourceFilesPath, options );

	// Save output files
	return convertedTsAstProject.save();
}

/**
 * Synchronously converts the JavaScript files under the given `sourceFilesPath`
 * to TypeScript files.
 *
 * @param sourceFilesPath The path to the source files to convert
 * @param options
 * @param options.indentationText The text used to indent new class property
 *   declarations.
 * @param options.logLevel The level of logging to show on the console.
 *   One of: 'debug', 'verbose', 'info', 'warn', 'error'
 * @param options.excludePatterns Glob patterns to exclude files.
 */
export function convertJsToTsSync( sourceFilesPath: string, options: {
	indentationText?: IndentationText,
	logLevel?: LogLevel,
	excludePatterns?: string[]
} = {} ) {
	const convertedTsAstProject = doConvert( sourceFilesPath, options );

	// Save output files
	convertedTsAstProject.saveSync();
}


/**
 * Performs the actual conversion given a `sourceFilesPath`, and returning a
 * `ts-simple-ast` Project with the converted source files.
 *
 * @param sourceFilesPath The path to the source files to convert
 * @param options
 * @param options.indentationText The text used to indent new class property
 *   declarations.
 * @param options.logLevel The level of logging to show on the console.
 *   One of: 'debug', 'verbose', 'info', 'warn', 'error'
 * @param options.excludePatterns Glob patterns to exclude files.
 */
function doConvert( sourceFilesPath: string, options: {
	indentationText?: IndentationText,
	logLevel?: LogLevel,
	excludePatterns?: string[]
} = {} ): Project {
	logger.setLogLevel( options.logLevel || 'verbose' );

	const absolutePath = path.resolve( sourceFilesPath );

	const tsAstProject = createTsAstProject( absolutePath, options );
	return convert( tsAstProject );
}