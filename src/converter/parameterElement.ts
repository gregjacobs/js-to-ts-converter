/**
 * Represents a parameter element of a Destructured Function Parameter. - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
 */
export class parameterElement {
	/**
	 * The name of the parameter.
	 */
	public name: string;

	/**
	 * The name of the parameter.
	 */
	public type?: string;

	/**
	 * The name of the parameter.
	 */
	public defaultValue?: string;

	/**
	 * The name of the parameter.
	 */
	public children?: parameterElement[];

	public constructor(name: string, type?: string, defaultValue?: string) {
		this.name = name;
		this.type = type;
		this.defaultValue = defaultValue;
	}
}
