export class TestRef {
	constructor() {
		// Types: [`TS Type` #TS Default# @TS IsOptional@ ^OA Type^ ~OA Format~] - https://regex101.com
		// TypeScript Data Types - https://www.typescriptlang.org/docs/handbook/basic-types.html
		// OpenAPI Data Types - https://swagger.io/docs/specification/data-models/data-types
		this.numberProp = null; // Types: [`number` #0# @true@ ^number^ ~~] - optional parameter
		this.strProp = null; // Types: [`string | undefined` #"New Value"# @@ ^string^ ~~] - union parameter
		this.boolProp = null; // Types: [`boolean | null` #true# @@ ^boolean^ ~~] - union parameter
		this.dateProp = null; // Types: [`Date` #new Date()# @@ ^string^ ~date~] -
	}

	toString() {
		return JSON.stringify(this);
	}
}
// TypeScript AST Viewer - https://ts-ast-viewer.com/#code/KYDwDg9gTgLgBAYwDYEMDOa4BVhpgJWADM4BvAKAEgEIA7PKAVwRmgAoBKMqygel+wBPMLgBccANoADLAGUhIqXADEcuABFiKRkhjK4AATUBJNAHkwMAJZ0USA3AB6ZgIILgjuAD9XcAGLQALYoMF4AunAAtHAAFjAwYGii-FDAAOagAIwADJkAdDSBPPzusghQVpYaISjumNFxCUn8AO5teTDCuOWVMKi0aXnQabwAJhAIaLwxKLSjAEYQEADWvPPoVgiRnSJoeXGBSMUCFsC0LgAKxtUwtVhd9bHxicm8aC0oaRlQeTZjE1M0CIEFYiJsQjZaGMapFAhBRsAkFNRjCdrgeDAYlY9rRGIF5sAoBcoBAwHAALxwXFIJAAbjgJXuu3E0lx+MJSmU2X0BhgTGADkcbIJUE8XnCUTgpOstiQcDAKCgKECwBghIxWL2DGJpIpVJ0dIZAiZYkkUgYVgGcAAPnBGHNiJbgKNOQAiABywBacAAanZGMBXTy+QHBRaBmKJdF7ZD5Yrlar1ZRKJjsXlFhAkDqyZTqYbGQ8WVIM0hgLNOSHgMH+YKS2XaJGIpENWmUWrs3q8-SC8yzeoQsBObQvTdgJweWG+Za0mK28Ao1QAL7kKisWRTgacbjJ1IwRhQWhwABSsjM7ry4bSoMEbFTaA4tKX5GXQA

export class Test {
	constructor() {
		// Types: [`TS Type` #TS Default# @TS IsOptional@ ^OA Type^ ~OA Format~] - https://regex101.com
		// TypeScript Data Types - https://www.typescriptlang.org/docs/handbook/basic-types.html
		// OpenAPI Data Types - https://swagger.io/docs/specification/data-models/data-types
		// TS Type pattern: `` - (?<=`).*(?=`)
		// TS Default pattern: ## - (?<=#).*(?=#)
		// TS IsOptional pattern: @@ - (?<=@).*(?=@)
		// OA Type pattern: ^^ - (?<=\^).*(?=\^)
		// OA Format pattern: ~~ - (?<=~).*(?=~)
		this.strProp = null; // Types: [`string` #"New Value"# @@ ^string^ ~~] -
		this.boolProp = null; // Types: [`boolean` #true# @@ ^boolean^ ~~] -

		// OpenAPI String - https://swagger.io/docs/specification/data-models/data-types/#string
		this.dateProp = null; // Types: [`Date` ## @@ ^string^ ~date~] -
		this.dateTimeProp = null; // Types: [`Date` ## @@ ^string^ ~date-time~] -
		this.byteProp = null; // Types: [`string` ## @@ ^string^ ~byte~] -
		this.binaryProp = null; // Types: [`string` ## @@ ^string^ ~binary~] -
		this.emailProp = null; // Types: [`string` ## @@ ^string^ ~email~] -

		// OpenAPI Numbers - https://swagger.io/docs/specification/data-models/data-types/#numbers
		this.intProp = null; // Types: [`number` ## @@ ^integer^] -
		this.int32Prop = null; // Types: [`number` ## @@ ^integer^ ~int32~] -
		this.int64Prop = null; // Types: [`number` ## @@ ^integer^ ~int64~] -
		this.floatProp = null; // Types: [`number` ## @@ ^number^ ~float~] -
		this.doubleProp = null; // Types: [`number` ## @@ ^number^ ~double~] -

		this.classProp = new TestRef(); // Types: [`TestRef` ## @@ ^object^ ~REF:TestRef~] - TestRef class
		this.arrayofClassProp = [new TestRef()]; // Types: [`TestRef[]` ## @@ ^array^ ~REF:TestRef[]~] - Arrray of TestRef class
	}

	toString() {
		return JSON.stringify(this);
	}
}
