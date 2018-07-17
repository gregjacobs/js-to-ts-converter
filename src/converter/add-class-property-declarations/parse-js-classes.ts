import Project, { ts, ClassDeclaration, ClassInstancePropertyTypes, ImportDeclaration, ImportSpecifier, MethodDeclaration, Node, PropertyAccessExpression, SourceFile, SyntaxKind, VariableDeclaration } from "ts-simple-ast";
import { JsClass } from "../../model/js-class";
import { difference, union } from "../../util/set-utils";
import { parseDestructuredProps } from "../../util/parse-destructured-props";
import { parseSuperclassNameAndPath } from "../../util/parse-superclass-name-and-path";
import { isThisReferencingVar } from "../../util/is-this-referencing-var";
import { propertyAccessWithObjFilter } from "../../util/is-property-access-with-obj";

/**
 * Parses the classes out of each .js file in the SourceFilesCollection, and
 * forms a tree representing their hierarchy.
 *
 * ## Description of algorithm:
 *
 * Each source file is parsed to find all file-level classes. Their superclasses
 * and import paths for those superclasses are also recorded to form an
 * adjacency list graph of classes keyed by their file path.
 *
 * Each class is also processed to find and record any property accesses of the
 * `this` object. For instance, in the following class, there are 3
 * PropertyAccessExpressions that pull from the `this` object ('something1',
 * 'something2', and 'something3'):
 *
 *     class Something {
 *         constructor() {
 *             this.something1 = 1;
 *             this.something2 = 2;
 *         }
 *
 *         someMethod() {
 *             console.log( this.something3 );
 *
 *             console.log( window.location );  // <-- not a `this` PropertyAccessExpression
 *         }
 *     }
 *
 * The returned graph will be used later to determine which TS class property
 * definitions should be placed in superclasses vs. subclasses. Properties used
 * by a superclass and a subclass should only be defined in the superclass.
 */
export function parseJsClasses( tsAstProject: Project ): JsClass[] {
	const files = tsAstProject.getSourceFiles();

	const jsClasses = files.reduce( ( classes: JsClass[], file: SourceFile ) => {
		const fileClasses = parseFileClasses( file );
		return classes.concat( fileClasses );
	}, [] );

	return jsClasses;
}


/**
 * Parses the file-level classes out of the given `sourceFile`.
 */
function parseFileClasses( sourceFile: SourceFile ): JsClass[] {
	return sourceFile.getClasses().map( fileClass => {
		const className = fileClass.getName();
		const { superclassName, superclassPath } = parseSuperclassNameAndPath( sourceFile, fileClass );
		const methodNames = getMethodNames( fileClass );
		const propertyNames = getPropertyNames( fileClass );

		const propertiesMinusMethods = difference( propertyNames, methodNames );  // remove any method names from this Set

		return new JsClass( {
			path: sourceFile.getFilePath(),
			name: className,
			superclassName,
			superclassPath,
			methods: methodNames,
			properties: propertiesMinusMethods
		} );
	} );
}


/**
 * Parses the method names from the class into a Set of strings.
 */
function getMethodNames( fileClass: ClassDeclaration ): Set<string> {
	return fileClass.getMethods()
		.reduce( ( methods: Set<string>, method: MethodDeclaration ) => {
			return methods.add( method.getName() );
		}, new Set<string>() );
}


/**
 * Retrieves the list of propertyNames used in the class. This may also include
 * method names (which are technically properties), which we'll filter out later.
 */
function getPropertyNames( fileClass: ClassDeclaration ) {
	const existingPropertyDeclarations = parsePropertyDeclarations( fileClass );  // in case we are actually parsing a TypeScript class with existing declarations
	const propertyAccesses = parsePropertyAccesses( fileClass );
	const destructuringUsesOfProperties = parseDestructuringThisAssignments( fileClass );
	const propertyAccessesOfThisAssignedVars = parsePropertyAccessesOfThisAssignedVars( fileClass );

	return union(
		existingPropertyDeclarations,
		propertyAccesses,
		destructuringUsesOfProperties,
		propertyAccessesOfThisAssignedVars
	);
}


/**
 * In the case that the utility is actually parsing TypeScript classes with
 * existing property declarations, we want to know about these so we don't
 * accidentally write in new ones of the same name.
 */
function parsePropertyDeclarations( fileClass: ClassDeclaration ): Set<string> {
	return fileClass.getInstanceProperties()
		.reduce( ( props: Set<string>, prop: ClassInstancePropertyTypes ) => {
			const propName = prop.getName();
			return propName ? props.add( propName ) : props;  // don't add unnamed properties (not sure how we would have one of those, but seems its possible according to the TsSimpleAst types)
		}, new Set<string>() );
}


/**
 * Parses the property names of `this` PropertyAccessExpressions.
 *
 * Examples:
 *
 *     this.something = 42;
 *     console.log( this.something2 );
 *
 *     const { destructured1, destructured2 } = this;
 *
 * Method returns:
 *
 *    Set( [ 'something', 'something2', 'destructured1', 'destructured2' ] )
 */
function parsePropertyAccesses( fileClass: ClassDeclaration ): Set<string> {
	// First, find all of the `this.something` properties
	const thisProps = fileClass
		.getDescendantsOfKind( SyntaxKind.PropertyAccessExpression )
		.filter( prop => prop.getExpression().getKind() === SyntaxKind.ThisKeyword );

	const propNamesSet = thisProps
		.reduce( ( props: Set<string>, prop: PropertyAccessExpression ) => {
			return props.add( prop.getName() );
		}, new Set<string>() );

	return propNamesSet;
}


/**
 * Parses any object destructuring statements of the form:
 *
 *     var { a, b } = this;
 *
 * And returns Set( [ 'a', 'b' ] ) in this case.
 */
function parseDestructuringThisAssignments( fileClass: ClassDeclaration ): Set<string> {
	// Second, find any `var { a, b } = this` statements
	const destructuredProps = fileClass
		.getDescendantsOfKind( SyntaxKind.VariableDeclaration )
		.filter( ( varDec: VariableDeclaration ) => {
			return varDec.compilerNode.name.kind === SyntaxKind.ObjectBindingPattern;
		} );

	return destructuredProps
		.reduce( ( propNames: Set<string>, varDec: VariableDeclaration ) => {
			const destructuredPropNames = parseDestructuredProps( varDec.compilerNode.name as ts.ObjectBindingPattern );
			destructuredPropNames.forEach( propName => propNames.add( propName ) );

			return propNames;
		}, new Set<string>() );
}


/**
 * Parses property accesses of variables that are assigned to the `this`
 * keyword.
 *
 * For example:
 *
 *     var that = this;
 *
 *     that.someProp1 = 1;
 *     that.someProp2 = 2;
 *
 * In the above code, the Set( [ 'someProp1', 'someProp2' ] ) is returned
 */
function parsePropertyAccessesOfThisAssignedVars(
	fileClass: ClassDeclaration
): Set<string> {
	const methods = fileClass.getMethods();

	return methods.reduce( ( propNames: Set<string>, method: MethodDeclaration ) => {
		const thisVarDeclarations = method
			.getDescendantsOfKind( SyntaxKind.VariableDeclaration )
			.filter( isThisReferencingVar );

		// Get the array of identifiers assigned to `this`. Ex: [ 'that', 'self' ]
		const thisVarIdentifiers = thisVarDeclarations
			.map( ( thisVarDec: VariableDeclaration ) => thisVarDec.getName() );

		thisVarIdentifiers.forEach( ( thisVarIdentifier: string ) => {
			// Get the properties accessed from the `this` identifiers (i.e. from
			// 'that', 'self', etc.)
			const propNamesAccessedFromIdentifier = method
				.getDescendantsOfKind( SyntaxKind.PropertyAccessExpression )
				.filter( propertyAccessWithObjFilter( thisVarIdentifier ) )
				.map( ( p: PropertyAccessExpression ) => p.getName() );

			propNamesAccessedFromIdentifier
				.forEach( ( propName: string ) => propNames.add( propName ) );
		} );

		return propNames;
	}, new Set<string>() );
}