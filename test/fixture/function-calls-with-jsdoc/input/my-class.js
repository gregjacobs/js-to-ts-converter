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
	constructor(stringParam, numberParam, options = {}, stringListParam = [], numberListParam = [], { param = {} } = {}) {
		this._weight = 0;
		this._isBright = false;
	}

	/**
	 * Sets the weight.
	 *
	 * @type {number}
	 */
	set weight(weight) {
		this._weight = weight + 1;
	}

	/**
	 * Gets the weight.
	 *
	 * @type {number}
	 */
	get weight() {
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
	setWeight(weight, seconds = 0, alterFn) {
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
	get isBright() {
		return this._isBright;
	}

	/**
	 * simple Return.
	 *
	 * @returns {boolean}
	 */
	simpleReturn() {
		return true;
	}

	/**
	 * simple params with Return.
	 * @param {string} strParam - str Param.
	 * @param {number} numParam - num Param.
	 *
	 * @returns {Array.<string>}
	 */
	simpleParamsWithReturn(strParam, numParam) {
		return [strParam, numParam.toString()];
	}

	smartMethodParameters(value, { p1 = "P1", p2 = 100, p3 = { p21: "P21", p22: { p31: "P31" } } } = {}) {
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
function addToWeight(weight, seconds = 0) {
	return weight + seconds + 2;
}

function smartFunctionParameters(value, { p1 = "P1", p2 = 100, p3 = { p21: "P21", p22: { p31: "P31" } } } = {}) {
	alert(`${p1} ${p2} ${p3}`);
}

// TypeScript AST Viewer - https://ts-ast-viewer.com
