import { Subject } from 'rxjs';

export class MySubClassWithSuperClassInNodeModules extends Subject {

	mySuperclassMethod() {
		this.myProp = 10;
	}

}