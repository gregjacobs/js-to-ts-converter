import DefaultExportClass from "./default-export-class";

export class AnotherSubClass extends DefaultExportClass {
	public anotherSubClassProp: any;

	constructor() {
		this.defaultExportClassProp = 45;  // from superclass
		this.anotherSubClassProp = 10;
	}
}