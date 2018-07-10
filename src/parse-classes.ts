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

	files.forEach( file => dfs( file ) );

	function dfs( file: SourceFile ) {
		const classes = parseClasses( file );

		classesMap.set( file.getFilePath(), classes );
	}

	function parseClasses( file: SourceFile ): JsClass[] {
		const fileClasses = file.getClasses();

		return fileClasses.map( fileClass => {
			const properties = parseProperties( fileClass );

			return new JsClass( file, properties );
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