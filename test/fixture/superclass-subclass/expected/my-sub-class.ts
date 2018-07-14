import { MyClass } from "./my-class";

export class MySubClass extends MyClass {
	public mySubClassProp: any;

	constructor() {
		this.mySuperClassProp = 42;  // from superclass's superclass - should not be added as a prop
		this.myClassProp1 = 43;  // from superclass - should not be added as a prop
		this.mySubClassProp = 1;
		this.mySuperclassMethod();  // should not be added as a property as it exists two superclasses up
	}
}