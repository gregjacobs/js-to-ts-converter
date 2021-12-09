import { SourceFile, ParameterDeclaration } from "ts-morph";

/**
 * Represents a parameter element of a Destructured Function Parameter. - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
 */
export class parameterFix {
	/**
	 * Source File.
	 */
	private _sourceFile: SourceFile;

	/**
	 * Parameter Declaration to fix.
	 */
	private _param: ParameterDeclaration;

	/**
	 * Position to insert text at.
	 */
	private _position: number;

	/**
	 * The name of the parameter.
	 */
	public _text: string;

	public constructor(sourceFile: SourceFile, param: ParameterDeclaration, text: string) {
		const initializer = " = {}";
		const paramText = param.getText();

		// Format takes thes out
		text = text.replace(/; }/g, " }");

		this._sourceFile = sourceFile;
		this._param = param;
		this._position = param.getEnd();
		this._text = `: ${text}`;

		if (paramText.endsWith(initializer)) {
			this._position -= initializer.length;
		}
	}

	static insert(insertTexts: parameterFix[]) {
		insertTexts
			.slice()
			.reverse()
			.forEach(function (item) {
				item._sourceFile.insertText(item._position, item._text);
			});
	}
}
