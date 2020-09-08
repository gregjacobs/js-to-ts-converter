# js-to-ts-converter

Small utility that I wrote to script converting a JS codebase to TypeScript,
while trying to solve some of the common TypeScript errors that will be received
upon such a conversion.

The utility performs the following transformations:

1. Renames `.js` files to `.ts`
2. Adds property declarations to ES6 classes so that they are compilable by the
   TypeScript compiler (see below).
3. Any function calls that provide fewer arguments than the declared parameters
   in the function will cause the remaining parameters to be marked as optional
   for that function. This solves TS errors like "Expected 3 arguments, but 
   got 2"
   
Note: because this utility utilizes the TypeScript Language Service to perform
the look-ups for #3, it may take a long time to run. For a small project, expect
a few minutes. For a larger project, it could take tens of minutes. Still much 
better than the days/weeks it could take to fix an entire codebase by hand :)
 

For #2 above, the utility basically looks at any `this` property accessed by a 
JS class, and fills in the appropriate TypeScript property declarations. Take 
this `.js` input source file as an example:

```js
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

```ts
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

```js
class MyClass {
    myMethod() {
        var that = this;
        
        that.something;  // <-- 'something' parsed as a class property
    }
}
```

For #3 above, parameters are marked as 'optional' when there are callers that
don't provide all of them. For example, the following JavaScript:

```js
function myFunction( arg1, arg2 ) {
	// ...
}

myFunction( 1 );  // only provide arg1
```

Will be transformed to the following TypeScript:

```ts
function myFunction( arg1, arg2? ) {  // <-- arg2 marked as optional
	// ...
}

myFunction( 1 );
```

## Goal

The goal of this utility is to simply make the `.js` code compilable under the
TypeScript compiler, so simply adding the property declarations typed as `any` 
was the quickest option there. The utility may look at property initializers in 
the future to determine a better type.

If you have other types of compiler errors that you think might be able to be 
transformed by this utility, please feel free to raise an issue (or pull
request!)

Hopefully you only need to use this utility once, but if it saved you time, 
please star it so that I know it helped you out :)


## Fair Warning

This utility makes modifications to the directory that you pass it. Make sure
you are in a clean git (or other VCS) state before running it in case you need
to revert!


## Running the Utility from the CLI

```
npx js-to-ts-converter ./path/to/js/files
```

If you would prefer to install the CLI globally, do this:

```
npm install --global js-to-ts-converter

js-to-ts-converter ./path/to/js/files
```


## Running the Utility from Node

TypeScript: 

```ts
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

```js
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
