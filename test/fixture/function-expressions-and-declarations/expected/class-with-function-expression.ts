class ClassWithFunctionExpression {
	public prop1: any;
	public prop2: any;
	public innerAccessedProp: any;
	public blah: any;

	myMethod() {
		var myFn1 = () => {
			this.prop1 = 1;
		}

		var myFn2 = (a, b) => {
			this.prop2 = 1;
			this['prop3'] = 2;
		}
	}

	myMethod2() {
		var somethingElse = 1;

		var myFn1 = () => {
			this.prop1 = 1;

			var myNestedFn = () => {
				this.innerAccessedProp = 2;
			}
		}
	}

	myMethod3() {
		var somethingElse = 1;

		var myFn1 = () => {
			this.prop1 = 1;
		}
	}

	complexMethodWhichCausesErrorInTsSimpleAstTransforms() {
		this.blah.blah2.blah3 = 42;
		this.blah.blah2.blah3.blah4 = 43;

		// below is potentially another test to check, but above seems to
		// display the previous bug
		//
		// if( this.asdf ) {
		// 	_.someFn( that.asdf.asdf2, () => {
		// 		_.someOtherFn( that.blah.blah2.blah3, () => {
		// 		} );
		// } );
		// }

		// if( !this.something ) {
		// 	this.something = this.someOtherThing.fn( () => {
		// 		const abc = [];
		//
		// 		_.forEach(that.model.something.else, (a) => {
		// 			// if( asdf ) {
		// 			// 	that.model.something = 1;
		// 			// } else {
		// 			// 	that.model.somethingElse = 2;
		// 			// }
		// 		} );
		//
		// 		that.model.something = 42;
		// 		_.set( that.model.something, 'abc', 'def' );
		// 		that.somethingElse = 11;
		// 	} );
		// }
	}

}