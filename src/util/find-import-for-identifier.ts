import { ImportDeclaration, ImportSpecifier, SourceFile } from "ts-morph";

/**
 * Finds an ImportDeclaration for a given identifier (name).
 *
 * For instance, given this source file:
 *
 *     import { SomeClass1, SomeClass2 } from './somewhere';
 *     import { SomeClass3 } from './somewhere-else';
 *
 *     // ...
 *
 * And a call such as:
 *
 *     findImportForIdentifier( sourceFile, 'SomeClass3' );
 *
 * Then the second ImportDeclaration will be returned.
 */
export function findImportForIdentifier(
	sourceFile: SourceFile,
	identifier: string
): ImportDeclaration | undefined {
	return sourceFile
		.getImportDeclarations()
		.find( ( importDeclaration: ImportDeclaration ) => {
			const hasNamedImport = importDeclaration.getNamedImports()
				.map( ( namedImport: ImportSpecifier ) => namedImport.getName() )
				.includes( identifier );

			const defaultImport = importDeclaration.getDefaultImport();
			const hasDefaultImport = !!defaultImport && defaultImport.getText() === identifier;

			return hasNamedImport || hasDefaultImport;
		} );
}