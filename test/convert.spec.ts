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
			.to.equal( 3 );


		const myClassFile = convertedProject.getSourceFileOrThrow( `${__dirname}/fixture/my-class.ts` );
		const mySubClassFile = convertedProject.getSourceFileOrThrow( `${__dirname}/fixture/my-sub-class.ts` );
		const twoClassesFile = convertedProject.getSourceFileOrThrow( `${__dirname}/fixture/two-classes.ts` );

		expect( myClassFile.getFullText() ).to.equal( `
			export class MyClass {
			    public myClassProp1: any;
			    public myClassProp2: any;
			    public myClassProp3: any;

				constructor() {
					this.myClassProp1 = 42;
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
					this.myClassProp1 = 43;  // from superclass
					this.mySubClassProp = 1;
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
