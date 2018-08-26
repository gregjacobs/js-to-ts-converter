import { TypescriptClass } from "./typescript-class";

export class TypescriptSubClass extends TypescriptClass {
	public prop2: any;

	constructor() {
		super();
		this.prop2 = 1;
	}
}