import { Project, IndentationText } from "ts-morph";
import fastGlob from "fast-glob";

/**
 * Creates a ts-morph Project by including the source files under the given
 * `directory`.
 *
 * @param directory The absolute path to the directory of .js files to
 *   include.
 * @param options
 * @param options.indentationText The text used to indent new class property
 *   declarations.
 * @param options.excludePatterns Glob patterns to exclude files.
 */
export function createTsMorphProject(
	directory: string,
	options: {
		indentationText?: IndentationText;
		includePatterns?: string[];
		excludePatterns?: string[];
	} = {}
) {
	const tsMorphProject = new Project({
		compilerOptions: {
			strictNullChecks: true,
		},
		manipulationSettings: {
			indentationText: options.indentationText || IndentationText.Tab,
		},
	});

	// Read files using fast-glob. fast-glob does a much better job over node-glob
	// at ignoring directories like node_modules without reading all of the files
	// in them first
	let files = fastGlob.sync(options.includePatterns || `**/*.+(js|ts|jsx|tsx)`, {
		cwd: directory,
		absolute: true,
		followSymbolicLinks: true,

		// filter out any path which includes node_modules. We don't want to
		// attempt to parse those as they may be ES5, and we also don't accidentally
		// want to write out into the node_modules folder
		ignore: ["**/node_modules/**"].concat(options.excludePatterns || []),
	});

	files.forEach((filePath: string) => {
		tsMorphProject.addSourceFileAtPath(filePath);
	});

	return tsMorphProject;
}
