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
	 * is Set Accessor.
	 */
	public isSetAccessor?: boolean;

	/**
	 * is Get Accessor.
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
	 * is Tag
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
	 * is Param.
	 */
	public isParam?: boolean;

	/**
	 * param Name.
	 */
	public paramName?: string;

	/**
	 * param Type.
	 */
	public paramType?: string;

	/**
	 * is Param Type Nullable.
	 */
	public isParamTypeOptional?: boolean;

	/**
	 * is Param Type Union.
	 */
	public isParamTypeUnion?: boolean;

	public constructor() {}
}
