# js-to-ts-converter

Small utility that I wrote to script converting a JS codebase which contains ES6 
classes into TypeScript classes.

The utility performs the following transformations:

1. Renames `.js` files to `.ts`
2. Adds property declarations to ES6 classes so that they are compilable by the
   TypeScript compiler (see below).

For #2 above, the utility basically looks at any `this` property accessed by a 
JS class, and fills in the appropriate TypeScript property declarations. Take 
this `.js` input source file as an example:

```
class Super {
	someMethod() {
		this.superProp = 1;
	}
}

class Sub extends Super {
	someMethod() {
		this.superProp = 2;
		this.subProp = 2;
	}
}
```


The above JS classes are replaced with the following TS classes:

```
class Super {
    public superProp: any;   // <-- added

    someMethod() {
        this.superProp = 1;
    }
}


class Sub extends Super {
    public subProp: any;    // <-- added

    someMethod() {
        this.superProp = 2;
        this.subProp = 2;
    }
}
```

Note: properties used when `this` is assigned to another variable are also 
found for purposes of creating property declarations. Example:

```
myMethod() {
    var that = this;
    
    that.something;  // <-- 'something' parsed as a class property
}
```

## Goal

The goal of this utility is to simply make the `.js` code compilable under the
TypeScript compiler, so simply adding the property declarations typed as `any` 
was the quickest option there. The utility may look at property initializers in 
the future to determine a better type.


## Fair Warning

This utility makes modifications to the directory that you pass it. Make sure
you are in a clean git (or other VCS) state before running it in case you need
to revert!


## Running the Utility from the CLI

```
npm install --global js-to-ts-converter

js-to-ts-converter path/to/js/files
```

## Running the Utility from Node

TypeScript: 

```
import { convertJsToTs, convertJsToTsSync } from 'js-to-ts-converter';


// Async
convertJsToTs( 'path/to/js/files' ).then( 
    () => console.log( 'Done!' ),
    ( err ) => console.log( 'Error: ', err );
); 


// Sync
convertJsToTsSync( 'path/to/js/files' );
console.log( 'Done!' );
```

JavaScript:

```
const { convertJsToTs, convertJsToTsSync } = require( 'js-to-ts-converter' );


// Async
convertJsToTs( 'path/to/js/files' ).then( 
    () => console.log( 'Done!' ),
    ( err ) => console.log( 'Error: ', err );
); 


// Sync
convertJsToTsSync( 'path/to/js/files' );
console.log( 'Done!' );
```

## Developing

Make sure you have [Node.js](https://nodejs.org) installed. 

Clone the git repo: 

```
git clone https://github.com/gregjacobs/js-to-ts-converter.git

cd js-to-ts-converter
```

Install dependencies:

```
npm install
```

Run Tests:

```
npm test
```
