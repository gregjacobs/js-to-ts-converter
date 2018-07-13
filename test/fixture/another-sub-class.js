import { MyClass } from "./my-class";

export class AnotherSubClass extends MyClass {
	constructor() {
		this.myClassProp1 = 45;  // from superclass
		this.anotherSubClassProp = 10;
	}
}