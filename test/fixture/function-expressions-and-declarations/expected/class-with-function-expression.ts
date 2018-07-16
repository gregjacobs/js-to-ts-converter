class ClassWithFunctionExpression {
	public prop1: any;
	public prop2: any;

	myMethod() {
		var myFn1 = () => {
			this.prop1 = 1;
		}

		var myFn2 = (a, b) => {
			this.prop2 = 1;
		}
	}

}