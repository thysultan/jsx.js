# jsx.js

a light and extendable jsx compiler.

- ~3kb minified
- ~1.5kb minified + gzipped

## API

```javascript
jsx(
	str, {string} 
	extend: {(Object<string, function>|string)}
);
```

This method recieves a string and optional extend object/string that is used to create
a custom mapping for the javascript output, for example...

```javascript
jsx(str, {
	text: function (children) {
	 	// return string
	},
	element: function (type, props, children) {
	 	// return string
	},
	component: function (type, props, children) {
		// return string 
	}
	props: function (props, node) {
		// return string
	}
	node: function (node) {
		// return string
	}
});

jsx(str, 'React.createElement');
```

If the input string has a pragma comment, for example`/* @jsx h */` it will use that for the output mapping.
