class ClassWithFunctionExpression {
	public prop1: any;
	public prop2: any;

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
		}
	}

	myMethod3() {
		var somethingElse = 1;

		var myFn1 = () => {
			this.prop1 = 1;
		}
	}

}