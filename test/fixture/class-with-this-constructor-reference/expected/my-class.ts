export class MyClass {
	public name: any;

	constructor() {}

	myMethod() {
		this.name = this.constructor.name;
	}

}