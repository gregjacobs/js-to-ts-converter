import { Subject } from 'rxjs';

export class MySubClass extends Subject {
	public myProp: any;

	mySuperclassMethod() {
		this.myProp = 10;
	}

}