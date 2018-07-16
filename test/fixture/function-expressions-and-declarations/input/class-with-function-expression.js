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

}