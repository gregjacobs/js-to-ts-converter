class SuperTypeScriptClass {
	public superProp: any;  // *declaration* that should not be added to subclass
}

class SubTypeScriptClass extends SuperTypeScriptClass {
	constructor() {
		super();
		this.superProp = 1;  // should not be added as a declaration in this class
		this.subProp = 2;    // *should* be filled in as it is currently missing in this class and its superclass
	}
}

class SubSubTypeScriptClass extends SubTypeScriptClass {
	constructor() {
		super();
		this.superProp = 1;  // should not be added as a declaration in this class as it is declared 2 superclasses up
	}
}