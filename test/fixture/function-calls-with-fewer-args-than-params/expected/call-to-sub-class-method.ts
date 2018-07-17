import { SubClass } from "./sub-class";

const subClass = new SubClass();

subClass.subclassMethod( 1, 2 );  // should *not* mark any args as optional

subClass.subclassMethod2();  // should mark both arg1 and arg2 as optional
