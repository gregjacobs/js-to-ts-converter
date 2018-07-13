import * as path from "path";
import * as fs from 'fs';

import Project, { PropertyDeclarationStructure, Scope } from "ts-simple-ast";
import { parseJsClasses } from "./parse-js-classes";
import { correctJsProperties } from "./correct-js-properties";

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

const tsAstProject = new Project();
tsAstProject.addExistingSourceFiles( `${absolutePath}/**/*.js` );

console.log( 'Processing the following source files for JS classes:' );
tsAstProject.getSourceFiles().forEach( sf => {
	console.log( `  ${sf.getFilePath()}` );
} );

// Parse the JS classes for all of the this.xyz properties that they use
const jsClassesGraph = parseJsClasses( tsAstProject );

// Correct the JS classes' properties for superclass/subclass relationships
// (essentially remove properties from subclasses that are defined by their
// superclasses)
const propertiesCorrectedJsClasses = correctJsProperties( jsClassesGraph );

// Fill in field definitions for each of the classes
propertiesCorrectedJsClasses.forEach( jsClass => {
	const sourceFile = tsAstProject.getSourceFileOrThrow( jsClass.path );

	const classDeclaration = sourceFile.getClassOrThrow( jsClass.name! );
	const jsClassProperties = jsClass.properties;

	const propertyDeclarations = jsClassProperties.map( propertyName => {
		return {
			name: propertyName,
			type: 'any',
			scope: Scope.Public
		} as PropertyDeclarationStructure;
	} );

	classDeclaration.insertProperties( 0, propertyDeclarations )
} );


// Rename .js files to .ts files
tsAstProject.getSourceFiles().forEach( sourceFile => {
	const dir = sourceFile.getDirectoryPath();
	const basename = sourceFile.getBaseNameWithoutExtension();
	sourceFile.move( `${dir}/${basename}.ts` );
} );

// Filter out any node_modules files that accidentally got included by an import.
// We don't want to modify these when we save the project
tsAstProject.getSourceFiles().forEach( sourceFile => {
	if( sourceFile.getFilePath().includes( 'node_modules' ) ) {
		tsAstProject.removeSourceFile( sourceFile );
	}
} );

console.log( 'Outputting .ts files:' );
tsAstProject.getSourceFiles().forEach( sf => {
	console.log( `  ${sf.getFilePath()}` );
} );
tsAstProject.saveSync();
