export class MySuperClass {
	public mySuperClassProp: any;

	constructor() {
		this.mySuperclassMethod();  // should not be added as a property
	}

	mySuperclassMethod() {
		this.mySuperClassProp = 10;
	}

}