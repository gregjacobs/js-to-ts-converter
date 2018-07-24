import { Subject } from 'rxjs';

export class MySubClass extends Subject {

	mySuperclassMethod() {
		this.mySuperClassProp = 10;
	}

}