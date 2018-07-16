class ClassWithFunctionExpression {

	myMethod() {
		var that = this;

		var myFn1 = function() {
			that.prop1 = 1;
		}

		var myFn2 = function(a, b) {
			that.prop2 = 1;
		}
	}

}