import { SomeSuperclass } from 'some-not-installed-module';

export class MyClassWithSuperClassInNodeModules extends SomeSuperclass {
	public myProp: any;

	myMethod() {
		this.myProp = 10;
	}

}