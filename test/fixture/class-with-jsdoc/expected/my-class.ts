/**
 * Test class - Test class
 * @class
 * @classdesc Test class description.
 * @public
 *
 * @param {?number} numberProp - number optional Prop - from class
 * @param {string | undefined} strProp - string union Prop - from class
 * @param {boolean} boolProp - boolean Prop - from class
 * @param {Date} dateProp - Date Prop - from class
 */
export class Test {
	public numberProp?: number;
	public strProp: string | undefined;
	public boolProp: boolean;
	public dateProp: Date;

	/**
	 * Test class - Test constructor
	 * @constructor
	 *
	 * @param {Object} [options] - Options - constructor param
	 * @param {?number} numberProp - number optional Prop - from constructor
	 * @param {string | undefined} strProp - string union Prop - from constructor
	 * @param {boolean} boolProp - boolean Prop - from constructor
	 * @param {Date} dateProp - Date Prop - from constructor
	 */
	constructor(options = {}) {
		this.numberProp = null;
		this.strProp = null;
		this.boolProp = null;
		this.dateProp = null;
	}

	toString() {
		return JSON.stringify(this);
	}
}
// TypeScript AST Viewer - https://ts-ast-viewer.com/#code/PQKhCgAIUgVBTAzgF0gYwDYENGMgWjiVUx0ShgAFTcLJrtcATJNIldRvFxNAJwCWAB2QCA9gDsAdHUpCArgCMMAtBVlCsfLAFtIAbwD8E+TsXw+AX0gmzFgAp8xQgjdPm+kR89cAzJ3o05ND0mtp6+iiCEgDmkAA+kPISLL4CEvBM1lHeLoRR6XG5fgGcZBpaugaKYmIY8FgS1jV1xYQt9Y1eTnmQ-mKBXBXhBgAiWMjw1kwT8G2Q45PdPoT9g+XQwODwAB5CYnwkXOyo+uAAkKAQ5yEIHEGudySSUfJoyAcXIdQvyHxvHz4X2u3zCVX0AHlFAAreDvawAbWcoheAF1XBCROIJHhCGhfv93gdIGCdMDQpUIsZ3BZrLYPPN6RZlr01ugCQDPjcqKSDAVYgkkil4GkMllIDkeq5+UUpatSvicX9OUDuRSRvoOg0mpAOvMtV15mzFa8iarQZSxrNprN5ot4CySgN2UrCYDgVtziblWaABTI7F4AC8BksAEoDBdzsgABYCRBSJl8YohkwYDAAbijsfjUklPlT8nTWfO0bjCb1UsLxez5akM0mKbcNfOlnAFw+AGU-oVfRGzqW+PBkPI+BJIAApTsQgByeZ7sQEvgAnr6c4gwyW222gA
