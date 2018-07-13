# js-to-ts-converter

Small utility that I wrote to script converting a JS codebase which contains ES6 
classes into TypeScript classes.

Basically looks at any `this` property accessed by a JS class, and fills in the
appropriate TypeScript class fields. 

Example .js source file (input):

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


Replaced with .ts file:

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

The utility also renames .js files to .ts.


## Fair Warning

This utility makes modifications to the directory that you pass it. Make sure
you are in a clean git (or other VCS) state before running it in case you need
to revert!


## Run the Utility

Check out the repository or download the `.zip` file from GitHub.

Install dependencies:

```
cd place/you/downloaded/or/cloned

npm install  # install dependencies

npm run cli path/to/your/folder/with/js/files
```


Run Tests:

```
yarn test
```
