import { MyClass } from "./my-class";

export class MySubClass extends MyClass {
	constructor() {
		this.myClassProp1 = 43;  // from superclass
		this.mySubClassProp = 1;
	}
}