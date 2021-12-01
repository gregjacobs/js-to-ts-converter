class ConstructorWithRestParam {
	constructor(...args) {
		// should *not* be marked as optional
	}

	methodWithRestParam(...args) {} // should *not* be marked as optional
}

const instance = new ConstructorWithRestParam();
instance.methodWithRestParam();
