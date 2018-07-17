export class SuperClass {

	constructor( arg1, arg2, arg3 ) {  // arg2 and arg3 will be marked optional by call-to-superclass-method.js

	}


	superclassMethod( arg ) {  // arg will be marked optional by sub-class.js

	}


	somePublicMethod( arg1, arg2 ) {  // arg2 will be marked optional by call-to-class-method.js

	}

}