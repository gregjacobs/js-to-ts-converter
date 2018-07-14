import { MySuperClass } from './my-super-class';

export class MyClass extends MySuperClass {

	constructor() {
		this.mySuperClassProp = 99;
		this.myClassProp1 = 42;
		this.doSomething();  // should not become a property
		this.mySuperclassMethod();  // should not become a property as it is a method in the superclass
	}

	doSomething() {
		this.myClassProp2 = 78;
		console.log( this.myClassProp3 );
	}

}