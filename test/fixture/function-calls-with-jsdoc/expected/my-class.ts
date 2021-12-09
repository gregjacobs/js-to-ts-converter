/**
 * Test class - Test class
 * @class
 * @classdesc Test class description.
 * @public
 *
 * @property {number} _weight - The target weight value - from class
 * @property {boolean} _isBright - _isBright - from class
 */
export class Test {
	private _weight: number;
	private _isBright: boolean;

	/**
	 * Test class - Test constructor
	 * @constructor
	 *
	 * @param {string | undefined} stringParam - string union Param - from constructor
	 * @param {?number} numberParam - number optional Param - from constructor
	 * @param {Object} [options={}] - Options.
	 * @param {boolean} [options.optionsParam=true] - optionsParam. For info only. Should be excluded from the parameter list.
	 * @param {Array.<string>} [stringListParam=[]] - Array of strings.
	 * @param {number[]} [numberListParam=[]] - Array of numbers.
	 */
	constructor(stringParam: string | undefined, numberParam?: number, options: any = {}, stringListParam: string[] = [], numberListParam: number[] = [], { param = {} }: { param?: {} | undefined } = {}) {
		this._weight = 0;
		this._isBright = false;
	}

	/**
	 * Sets the weight.
	 *
	 * @type {number}
	 */
	set weight(weight: number) {
		this._weight = weight + 1;
	}

	/**
	 * Gets the weight.
	 *
	 * @type {number}
	 */
	get weight(): number {
		return this._weight;
	}

	/**
	 * Updates the weight.
	 *
	 * @param {number} weight - The target weight value.
	 * @param {number} [seconds=0] - The time to reach the weight.
	 * @param {any} alterFn - The alter function.
	 *
	 * @returns {number}
	 */
	setWeight(weight: number, seconds: number = 0, alterFn: any): number {
		weight = weight + 1;
		this.weight = alterFn(weight);
		return this._weight;
	}

	/**
	 * is Bright.
	 *
	 * @readonly
	 * @type {boolean}
	 */
	get isBright(): boolean {
		return this._isBright;
	}

	/**
	 * simple Return.
	 *
	 * @returns {boolean}
	 */
	simpleReturn(): boolean {
		return true;
	}

	/**
	 * simple params with Return.
	 * @param {string} strParam - str Param.
	 * @param {number} numParam - num Param.
	 *
	 * @returns {Array.<string>}
	 */
	simpleParamsWithReturn(strParam: string, numParam: number): string[] {
		return [strParam, numParam.toString()];
	}

	smartMethodParameters(value: any, { p1 = "P1", p2 = 100, p3 = { p21: "P21", p22: { p31: "P31" } } }: { p1?: string | undefined; p2?: number | undefined; p3?: { p21: string; p22: { p31: string } } | undefined } = {}) {
		alert(`${p1} ${p2} ${p3}`);
	}
}

/**
 * Add to weight.
 *
 * @param {number} weight - The target weight value.
 * @param {number} [seconds=0] - The time to reach the weight.
 *
 * @returns {number}
 */
function addToWeight(weight: number, seconds: number = 0): number {
	return weight + seconds + 2;
}

function smartFunctionParameters(value: any, { p1 = "P1", p2 = 100, p3 = { p21: "P21", p22: { p31: "P31" } } }: { p1?: string | undefined; p2?: number | undefined; p3?: { p21: string; p22: { p31: string } } | undefined } = {}) {
	alert(`${p1} ${p2} ${p3}`);
}

// TypeScript AST Viewer - https://ts-ast-viewer.com
