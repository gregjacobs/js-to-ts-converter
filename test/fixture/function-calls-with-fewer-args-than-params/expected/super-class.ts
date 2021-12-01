export class SuperClass {
	constructor(arg1: any, arg2?: any, arg3?: any) {
		// arg2 and arg3 will be marked optional by call-to-superclass-method.js
	}

	superclassMethod(arg?: any) {
		// arg will be marked optional by sub-class.js
	}

	somePublicMethod(arg1: any, arg2?: any) {
		// arg2 will be marked optional by call-to-class-method.js
	}
}
