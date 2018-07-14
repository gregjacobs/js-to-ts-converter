import { expect } from 'chai';
import { createTsAstProject } from "../src/create-ts-ast-project";
import { convert } from "../src/converter/convert";

describe( 'convert()', () => {

	it( `should convert JS classes to TS-compilable classes by filling in field
	     (property) definitions for properties consumed in the original JS classes`,
	() => {
		const tsAstProject = createTsAstProject( `${__dirname}/fixture` );

		const convertedProject = convert( tsAstProject );
		expect( convertedProject.getSourceFiles().length )
			.to.equal( 6 );


		const myClassFile = convertedProject.getSourceFileOrThrow( `${__dirname}/fixture/my-class.ts` );
		const mySubClassFile = convertedProject.getSourceFileOrThrow( `${__dirname}/fixture/my-sub-class.ts` );
		const defaultExportClassFile = convertedProject.getSourceFileOrThrow( `${__dirname}/fixture/default-export-class.ts` );
		const anotherSubClassFile = convertedProject.getSourceFileOrThrow( `${__dirname}/fixture/another-sub-class.ts` );
		const mySuperClassFile = convertedProject.getSourceFileOrThrow( `${__dirname}/fixture/my-super-class.ts` );
		const twoClassesFile = convertedProject.getSourceFileOrThrow( `${__dirname}/fixture/two-classes.ts` );

		expect( myClassFile.getFullText() ).to.equal( `
			import { MySuperClass } from './my-super-class';

			export class MyClass extends MySuperClass {
			    public myClassProp1: any;
			    public myClassProp2: any;
			    public myClassProp3: any;

				constructor() {
					this.mySuperClassProp = 99;
					this.myClassProp1 = 42;
					this.doSomething();  // should not become a property
					this.mySuperclassMethod();  // should not become a property as it is a method in the superclass
				}

				doSomething() {
					this.myClassProp2 = 78;
					console.log( this.myClassProp3 );
				}
			
			}
		`.trim().replace( /^\t{3}/gm, '' ) );

		expect( mySubClassFile.getFullText() ).to.equal( `
			import { MyClass } from "./my-class";

			export class MySubClass extends MyClass {
			    public mySubClassProp: any;

				constructor() {
					this.mySuperClassProp = 42;  // from superclass's superclass - should not be added as a prop
					this.myClassProp1 = 43;  // from superclass - should not be added as a prop
					this.mySubClassProp = 1;
					this.mySuperclassMethod();  // should not be added as a property as it exists two superclasses up
				}
			}
		`.trim().replace( /^\t{3}/gm, '' ) );

		expect( defaultExportClassFile.getFullText() ).to.equal( `
			class DefaultExportClass {
			    public defaultExportClassProp: any;

				constructor() {
					this.defaultExportClassProp = 1;
				}
			
			}
			
			export default DefaultExportClass;
		`.trim().replace( /^\t{3}/gm, '' ) );

		expect( anotherSubClassFile.getFullText() ).to.equal( `
			import DefaultExportClass from "./default-export-class";

			export class AnotherSubClass extends DefaultExportClass {
			    public anotherSubClassProp: any;

				constructor() {
					this.defaultExportClassProp = 45;  // from superclass
					this.anotherSubClassProp = 10;
				}
			}
		`.trim().replace( /^\t{3}/gm, '' ) );

		expect( mySuperClassFile.getFullText() ).to.equal( `
			export class MySuperClass {
			    public mySuperClassProp: any;

				constructor() {
					this.mySuperclassMethod();  // should not be added as a property
				}

				mySuperclassMethod() {
					this.mySuperClassProp = 10;
				}

			}
		`.trim().replace( /^\t{3}/gm, '' ) );

		expect( twoClassesFile.getFullText() ).to.equal( `
			class Super {
			    public superProp: any;

				someMethod() {
					this.superProp = 1;
				}
			}
			
			
			class Sub extends Super {
			    public subProp: any;

				someMethod() {
					this.superProp = 2;
					this.subProp = 2;
				}
			}
		`.trim().replace( /^\t{3}/gm, '' ) );
	} );

} );
