import { Subject } from 'rxjs';

export class MySubClassWithSuperClassInNodeModules extends Subject {
	public myProp: any;

	mySuperclassMethod() {
		this.myProp = 10;
	}

}