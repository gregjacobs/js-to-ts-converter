class Super {
	public superProp: any;

	someMethod() {
		this.superProp = 1;
	}
}


class Sub extends Super {
	public subProp: any;

	someMethod() {
		this.superProp = 2;
		this.subProp = 2;
	}
}