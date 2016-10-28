# jsx.js

An extendable and lightweight jsx parser without regex

- ~14kb minified
- ~3 minified and gzipped

## API

### jsx.parse

```javascript
jsx.parse({string}) => ({VNode[]})
```

This method recieves a string and parsers to create a AST representation of the jsx structure

### jsx.transpile

```javascript
jsx.transpile({string}) => ({string})
```

Where jsx might receive a short string of just the relevant parts this method accepts anything
finds the jsx code and replaces it with javascript code and returns the new string.


### jsx.stringify

```javascript
jsx.stringify({string}) => ({VNode[]})
```

Takes an AST and converts it to a string, internally `jsx.transpile` uses both this and
`jsx.parse` to generate its ouput.

### jsx.extend

```javascript
jsx.extend({Object}) => ()
```
Internally the library uses three functions to determine the structure of the resulting element/node
`VComponent` that handles component, `VElement` for elements and `VText` for text nodes and `VProps`
for pushing new props.

You can inject your own functions to use to create a structure that works with your prefered framework.
The following is the logic of the default functions used tailored by default for [Dio.js](https://github.com/thysultan/dio.js)

```javascript
jsx.extend({
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
})
```
