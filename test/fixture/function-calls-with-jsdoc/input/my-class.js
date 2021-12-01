/**
 * Test class - Test class
 * @class
 * @classdesc Test class description.
 * @public
 *
 * @param {number} _weight - The target weight value - from class
 * @param {boolean} _isBright - _isBright - from class
 */
export class Test {
	constructor() {
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

	// TODO:
	// @returns {Deferred}
	// @param {Function=} alterFn - The alter function.

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

// TypeScript AST Viewer - https://ts-ast-viewer.com
