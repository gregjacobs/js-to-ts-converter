import { SuperClass } from "./super-class";

export class SubClass extends SuperClass {

	subclassMethod( arg1: any, arg2: any ) {  // these should *not* be made optional by the call in call-to-sub-class-method.js
		// call superclass method
		this.superclassMethod();  // marks the arg as optional
	}


	subclassMethod2( arg1?: any, arg2?: any ) {  // these should both be made optional by the call in call-to-sub-class-method.js

	}

}