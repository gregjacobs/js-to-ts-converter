class ClassWithFunctionExpression {

	myMethod() {
		var that = this;

		var myFn1 = function() {
			that.prop1 = 1;
		}

		var myFn2 = function(a, b) {
			that.prop2 = 1;
			that['prop3'] = 2;
		}
	}

	myMethod2() {
		var self = this,
		    somethingElse = 1;

		var myFn1 = function() {
			self.prop1 = 1;
		}
	}

	myMethod3() {
		var somethingElse = 1,
		    me = this;

		var myFn1 = function() {
			me.prop1 = 1;
		}
	}

	complexMethodWhichCausesErrorInTsSimpleAstTransforms() {
		const that = this;

		that.blah.blah2.blah3 = 42;

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