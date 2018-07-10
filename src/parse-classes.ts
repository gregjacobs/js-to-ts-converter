import * as ts from 'typescript';
import Project, { ClassDeclaration, SourceFile } from "ts-simple-ast";
import { JsClass } from "./model/js-class";
import { JsClassesCollection } from "./model/js-classes-collection";

/**
 * Parses the classes out of each .js file in the SourceFilesCollection, and
 * forms a tree representing their hierarchy.
 */
export function parseClasses( tsAstProject: Project ): JsClassesCollection {
	const files = tsAstProject.getSourceFiles();
	const classesMap = new Map<string, JsClass[]>();
	const seenFiles = new Set<string>();

	files.forEach( file => dfs( file ) );

	// performs a depth-first-search in order to find all of the classes in all
	// the files, in the order of their imports so that superclass information
	// can be used by subclasses
	function dfs( file: SourceFile ) {
		const filePath = file.getFilePath();

		// Already processed this source file, return
		if( seenFiles.has( filePath ) ) {
			return;
		}
		seenFiles.add( filePath );

		// First, follow imports and find their classes in a DFS manner
		file.getImportDeclarations().forEach( importDecl => {
			const importSourceFile = importDecl.getModuleSpecifierSourceFile();

			if( importSourceFile ) {  // will be undefined if we can't reference it, such as it existing in node_modules
				dfs( importSourceFile );
			}
		} );

		const classes = parseClasses( file );
		classesMap.set( file.getFilePath(), classes );
	}

	function parseClasses( file: SourceFile ): JsClass[] {
		return file.getClasses().map( fileClass => {
			const className = fileClass.getName();
			const properties = parseProperties( fileClass );

			// Remove properties that are in the parent class
			const heritage = fileClass.getExtends();
			if( heritage ) {
				const parentClass = heritage.getExpression().getText();

				console.log( '(TODO) parent class: ', parentClass );
				// TODO: Look up the parent class by file path, and get the set
				// of properties used in the parent class so we can filter out
				// the properties of the current class using it
			}

			return new JsClass( file, className, properties );
		} );
	}

	return new JsClassesCollection( classesMap );
}


/**
 * Parses the property names of `this` PropertyAccessExpressions.
 *
 * Example:
 *
 *     this.something = 42;
 *     this.something2 = 43;
 *     console.log( this.something3 );
 *
 * Method returns:
 *
 *     [ 'something', 'something2', 'something3' ]
 */
function parseProperties( fileClass: ClassDeclaration ): string[] {
	const thisProps = fileClass
		.getDescendantsOfKind( ts.SyntaxKind.PropertyAccessExpression )
		.filter( prop => prop.getExpression().getKind() === ts.SyntaxKind.ThisKeyword );

	const propNames = thisProps.map( prop => prop.getName() );
	//console.log( propNames );

	return propNames;
}