import DefaultExportClass from "./default-export-class";

export class AnotherSubClass extends DefaultExportClass {
	constructor() {
		this.defaultExportClassProp = 45;  // from superclass
		this.anotherSubClassProp = 10;
	}
}