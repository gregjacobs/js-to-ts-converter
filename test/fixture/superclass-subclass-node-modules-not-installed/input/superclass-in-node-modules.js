import { SomeSuperclass } from 'some-not-installed-module';

export class MyClassWithSuperClassInNodeModules extends SomeSuperclass {

	myMethod() {
		this.myProp = 10;
	}

}