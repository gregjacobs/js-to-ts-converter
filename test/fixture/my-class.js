import { MySuperClass } from './my-super-class';

export class MyClass extends MySuperClass {

	constructor() {
		this.mySuperClassProp = 99;
		this.myClassProp1 = 42;
	}

	doSomething() {
		this.myClassProp2 = 78;
		console.log( this.myClassProp3 );
	}

}