# jsx.js

a light and extendable jsx compiler.

- ~3kb minified
- ~2kb minified + gzipped

## API

```javascript
jsx(
	str, {string} 
	extend: {Object<string, function>}
);
```

This method recieves a string and optional extend object that is used to create
a custom mapping for the javascript output, for example...

```javascript
jsx(str, {
	text: function (children) {
	 	return {
	 		nodeType: 3,
	 		type: 'text',
	 		props: emptyObject,
	 		children: children || '',
	 		_el: null
	 	};
	},
	element: function (type, props, children) {
	 	return {
	 		nodeType: 1,
	 		type: type || '',
	 		props: props || {},
	 		children: children || [],
	 		_el: null
	 	};
	},
	component: function (type, props, children) {
		return {
	 		nodeType: 1,
	 		type: type || '',
	 		props: props || {},
	 		children: children || [],
	 		_el: null
	 	}; 
	}
	props: function (key, value, props, node) {
		props[key] = value;
	}
	stringify: function (type, props, children, nodeType) {
		return '{nodeType:'+nodeType+',type:'+type+',props:{'+props+'},children:'+children+',_el:null}';
	}
});
```

If the input string has a pragma comment, for example`/** @jsx h */` it will use that for the output mapping.
