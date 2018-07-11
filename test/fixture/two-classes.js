class Super {
	someMethod() {
		this.superProp = 1;
	}
}


class Sub extends Super {
	someMethod() {
		this.superProp = 2;
		this.subProp = 2;
	}
}