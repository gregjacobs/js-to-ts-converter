export class MyClass {

	constructor() {}

	myMethod() {
		this.constructor();  // for some reason someone calls this (https://github.com/gregjacobs/js-to-ts-converter/issues/9) 
	}

}