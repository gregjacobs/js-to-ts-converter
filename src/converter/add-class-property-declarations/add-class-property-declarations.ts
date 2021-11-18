import { Project, ClassInstancePropertyTypes, ClassDeclaration, PropertyDeclarationStructure, Scope, SyntaxKind } from "ts-morph";
import { parseJsClasses } from "./parse-js-classes";
import { correctJsProperties } from "./correct-js-properties";
import logger from "../../logger/logger";

/**
 * Parses all source files looking for ES6 classes, and takes any `this`
 * property access to create a PropertyDeclaration for the class.
 *
 * For example:
 *
 *     class Something {
 *         constructor() {
 *             this.someProp = 1;
 *         }
 *     }
 *
 * Is changed to:
 *
 *     class Something {
 *         someProp: any;
 *
 *         constructor() {
 *             this.someProp = 1;
 *         }
 *     }
 */
export function addClassPropertyDeclarations(tsAstProject: Project): Project {
	// Parse the JS classes for all of the this.xyz properties that they use
	const jsClasses = parseJsClasses(tsAstProject);

	// Correct the JS classes' properties for superclass/subclass relationships
	// (essentially remove properties from subclasses that are defined by their
	// superclasses)
	const propertiesCorrectedJsClasses = correctJsProperties(jsClasses);

	// Fill in field definitions for each of the classes
	propertiesCorrectedJsClasses.forEach(jsClass => {
		const sourceFile = tsAstProject.getSourceFileOrThrow(jsClass.path);
		logger.verbose(`  Updating class '${jsClass.name}' in '${sourceFile.getFilePath()}'`);

		const classDeclaration = sourceFile.getClassOrThrow(jsClass.name!);
		const jsClassProperties = jsClass.properties;

		// If the utility was run against a TypeScript codebase, we should not
		// fill in property declarations for properties that are already
		// declared in the class. However, we *should* fill in any missing
		// declarations. Removing any already-declared declarations from the
		// jsClassProperties.
		const currentPropertyDeclarations = classDeclaration.getInstanceProperties()
			.reduce((props: Set<string>, prop: ClassInstancePropertyTypes) => {
				const propName = prop.getName();
				return propName ? props.add(propName) : props;
			}, new Set<string>());

		let undeclaredProperties = [...jsClassProperties]
			.filter((propName: string) => !currentPropertyDeclarations.has(propName));

		// If the utility found a reference to this.constructor, we don't want to
		// add a property called 'constructor'. Filter that out now.
		// https://github.com/gregjacobs/js-to-ts-converter/issues/9
		undeclaredProperties = undeclaredProperties
			.filter((propName: string) => propName !== 'constructor');

		// Add all currently-undeclared properties
		const propertyDeclarations = undeclaredProperties.map(propertyName => {
			const types = getTypesFromComment(propertyName, classDeclaration);

			if (types.tsIsNullable === 'true') {
				types.tsType = `${types.tsType} | null`;
			}
			return {
				name: propertyName,
				type: types.tsType,
				scope: Scope.Public
			} as PropertyDeclarationStructure;
		});

		logger.verbose(`    Adding property declarations for properties: '${undeclaredProperties.join("', '")}'`);
		classDeclaration.insertProperties(0, propertyDeclarations);

		// logger.verbose(`    Setting property defaults for properties: '${undeclaredProperties.join("', '")}'`);
		undeclaredProperties.map(propertyName => {
			const types = getTypesFromComment(propertyName, classDeclaration);

			// Add default value to a property
			const propDeclaration = classDeclaration.getPropertyOrThrow(propertyName)
			if (propDeclaration !== null) {
				if (types.tsDefault !== '') {
					propDeclaration.setInitializer(types.tsDefault);
				}
				if (types.commentText !== '') {
					const comments = propDeclaration.getLeadingCommentRanges();
				}
			}
		});
	});

	return tsAstProject;
}

function getTypesFromComment(propertyName: string, classDeclaration: ClassDeclaration): {
	tsType: string;
	tsDefault: string;
	tsIsNullable: string;
	oaType: string;
	oaFormat: string;
	commentText: string;
} {
	let tsType = 'any';
	let tsDefault = '';
	let tsIsNullable = '';
	let oaType = '';
	let oaFormat = '';
	let commentText = '';
	const constructors = classDeclaration.getConstructors().map((constructor) => {
		const statements = constructor.getStatementsWithComments().map((statement) => {
			const statementText = statement.getText();
			if (statementText.includes(propertyName)) {
				const comments = statement.getTrailingCommentRanges().map((comment) => {
					commentText = comment.getText();

					// Types: [`TS Type` #TS Default# ^OA Type^ ~OA Format~] - https://regex101.com

					// TS Type pattern: (?<=`).*(?=`)
					const tsTypeMatch = commentText.match(/(?<=`).*(?=`)/);
					if (tsTypeMatch !== null) {
						tsType = tsTypeMatch[0];
					}

					// TS Default pattern: (?<=#).*(?=#)
					const tsDefaultMatch = commentText.match(/(?<=#).*(?=#)/);
					if (tsDefaultMatch !== null) {
						tsDefault = tsDefaultMatch[0];
					}

					// TS IsNullable pattern: (?<=@).*(?=@)
					const tsIsNullableMatch = commentText.match(/(?<=@).*(?=@)/);
					if (tsIsNullableMatch !== null) {
						tsIsNullable = tsIsNullableMatch[0];
					}

					// OA Type pattern: (?<=\^).*(?=\^)
					const oaTypeMatch = commentText.match(/(?<=\^).*(ß?=\^)/);
					if (oaTypeMatch !== null) {
						oaType = oaTypeMatch[0];
					}

					// OA Format pattern: (?<=~).*(?=~)
					const oaFormatMatch = commentText.match(/(?<=~).*(?=~)/);
					if (oaFormatMatch !== null) {
						oaFormat = oaFormatMatch[0];
					}
				});
			}
		});
	});
	return { tsType, tsDefault, tsIsNullable, oaType, oaFormat, commentText };
}