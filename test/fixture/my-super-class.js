export class MySuperClass {

	constructor() {
		this.mySuperclassMethod();  // should not be added as a property
	}

	mySuperclassMethod() {
		this.mySuperClassProp = 10;
	}

}