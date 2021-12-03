import os from "os";

/**
 * Represents a JSDoc element found in a source file.
 */
export class jsDocElement {
	/**
	 * The name of the class.
	 */
	public className?: string;

	/**
	 * The name of the method.
	 */
	public methodName?: string;

	/**
	 * Is Set Accessor.
	 */
	public isSetAccessor?: boolean;

	/**
	 * Is Get Accessor.
	 */
	public isGetAccessor?: boolean;

	/**
	 * The returnType of the method.
	 */
	public returnType?: string;

	/**
	 * The description of the item (class, constructor, method).
	 */
	public description?: string;

	/**
	 * Is Tag
	 */
	public isTag?: boolean;

	/**
	 * Tag name.
	 */
	public tagName?: string;

	/**
	 * Tag comment.
	 */
	public tagcomment?: string;

	/**
	 * Tag Text.
	 */
	public tagText?: string;

	/**
	 * Is Param.
	 */
	public isParam?: boolean;

	/**
	 * Is Param Private.
	 */
	public isParamPrivate?: boolean;

	/**
	 * param Name.
	 */
	private _paramName?: string;

	/**
	 * Param Type.
	 */
	private _paramType?: string;

	/**
	 * Is Param Type Optional.
	 */
	public isParamTypeOptional?: boolean;

	/**
	 * is Param Type Union.
	 */
	public isParamTypeUnion?: boolean;

	/**
	 * Is Param Bracketed.
	 */
	public isParamBracketed?: boolean;

	public constructor() {}

	public set paramName(paramName: string | undefined) {
		// Exclude info only param like: [options.optionsParam=true]
		if (paramName && !paramName.includes(".")) {
			this.isParam = true;

			// Set scope (public/private)
			if (paramName?.startsWith("_")) {
				this.isParamPrivate = true;
			}
			this._paramName = paramName;
		}
	}

	public get paramName(): string | undefined {
		return this._paramName;
	}

	public set paramType(paramType: string | undefined | null) {
		// TODO: find the right ts-morph way to get this param.
		//   JSDocParameterTag.getTypeExpression()?.getTypeNode()?.getText() return both lines and it's impossible to get the parameter/property type.
		//  @param {Object} [options={}] - ...
		//  @param {boolean} [options.optionsParam=true] - ...
		if (paramType?.includes(`${this._paramName}.`) && paramType?.includes(os.EOL)) {
			const firstLine = this.tagText?.split(os.EOL)[0];
			const fregment = this.tagText?.split(this.paramName!)[0];
			const paramTypeMatch = fregment?.match(new RegExp("(?<={).+?(?=})"));

			if (paramTypeMatch && paramTypeMatch.length > 0) {
				paramType = paramTypeMatch[0];
			}
		}

		this._paramType = this.adjustParamType(paramType);
	}

	public get paramType(): string | undefined {
		return this._paramType;
	}

	public setParamNameAndType(tagcomment: string | undefined) {
		// TODO: get @property name, type comment the ts-morph way
		const commentLen = tagcomment?.length!;
		let paramNameAndType = tagcomment;
		let commentPos = tagcomment?.indexOf(" - ")!;

		if (commentPos > 0) {
			paramNameAndType = paramNameAndType?.substring(0, commentPos);
			this.tagcomment = tagcomment?.substring(commentPos);
		}

		// Split paramNameAndType to Name, Type: {string} strProperty
		const paramNameAndTypeArray = paramNameAndType?.split(" ")!;

		if (paramNameAndTypeArray?.length! > 0) {
			this._paramType = paramNameAndTypeArray[0];
			this._paramType = this._paramType.replace("{", "").replace("}", "");
			this._paramName = paramNameAndTypeArray[1];
			if (this._paramType) {
				this._paramType = this.adjustParamType(this._paramType);
			}
			if (this._paramName) {
				this.isParam = true;

				// Set scope (public/private)
				if (this._paramName?.startsWith("_")) {
					this.isParamPrivate = true;
				}
			}
		}
	}

	private adjustParamType(paramType: string | undefined | null): string | undefined {
		// TODO: find the right ts-morph way to get this
		if (paramType?.startsWith("?")) {
			this.isParamTypeOptional = true;
			paramType = paramType.replace("?", "");
		}

		// TODO: find the right ts-morph way to get this
		if (paramType?.includes("|")) {
			this.isParamTypeUnion = true;
		}

		// Clean Param Type
		paramType = paramType?.replace("=", "");

		// Array.<string> -> string[]
		if (paramType?.includes("Array.<")) {
			paramType = paramType.replace("Array.<", "").replace(">", "") + "[]";
		}

		// Array.<Array.<string>> -> string[][]
		if (paramType?.includes("Array.<Array.<")) {
			paramType = paramType.replace("Array.<Array.<", "").replace(">>", "") + "[][]";
		}

		// Replace Param Types
		paramType = paramType?.replace("Object", "any").replace("Function", "any");

		return paramType;
	}
}
