class ConstructorWithRestParam {

	constructor( ...args ) {  // should *not* be marked as optional

	}

	methodWithRestParam( ...args: any ) {}  // should *not* be marked as optional

}


const instance = new ConstructorWithRestParam();
instance.methodWithRestParam();