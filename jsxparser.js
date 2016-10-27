/*!
 *        _          
 *       (_)_____  __
 *      / / ___/ |/_/
 *     / (__  )>  <  
 *  __/ /____/_/|_|  
 * /___/ 
 *
 * 
 * Jsx.js a blazing fast, lightweight jsx parser. 
 * https://github.com/thysultan/jsx.js
 * 
 * @licence MIT
 */
(function (global, factory) {
	if (typeof exports === 'object' && typeof module !== 'undefined') {
		module.exports = factory();
	} else if (typeof define === 'function' && define.amd) {
		define('jsx', factory);
	} else {
		global.jsx = factory();
	}
}(this, function () {
	'use strict';

	var emptyObject = {},
		boolProps   = {
	 	async:    0,  autofocus:  0,  autoplay:  0,  checked:    0,  allowFullscreen: 0,   
	 	controls: 0,  declare:    0,  default:   0,  multiple:   0,  defaultMuted: 0,     
	 	defer:    0,  disabled:   0,  draggable: 0,  enabled:    0,  formNoValidate: 0,   
	 	inert:    0,  isMap:      0,  itemScope: 0,  loop:       0,  defaultChecked: 0,         
	 	noShade:  0,  noValidate: 0,  noWrap:    0,  open:       0,  pauseOnExit: 0,      
	 	reversed: 0,  scoped:     0,  seamless:  0,  selected:   0,  typeMustMatch: 0,        
	 	sortable: 0,  visible:    0,  trueSpeed: 0,  noResize:   0,  indeterminate: 0, 
	 	noHref:   0,  required:   0,  translate: 0,  spellcheck: 0,  defaultSelected: 0,
	 	compact:  0,  hidden:     0,  muted:     0,  readOnly:   0
	};


	/**
	 * ---------------------------------------------------------------------------------
	 * 
	 * factories
	 * 
	 * ---------------------------------------------------------------------------------
	 */
	

	/**
	 * vtext factory
	 * 
	 * @param {string} children
	 */
	function VText (children) {
	 	return {
	 		nodeType: 3,
	 		type: 'text',
	 		props: emptyObject,
	 		children: children || '',
	 		_el: null
	 	};
	}

	/**
	 * vnode factory
	 * 
	 * @param {string}  type
	 * @param {Object}  props
	 * @param {VNode[]} children
	 */
	function VElement (type, props, children) {
	 	return {
	 		nodeType: 1,
	 		type: type || '',
	 		props: props || {},
	 		children: children || [],
	 		_el: null
	 	};
	}

	/**
	 * vcomponent factory 
	 * 
	 * @param {string}  type
	 * @param {Object}  props
	 * @param {VNode[]} children
	 */
	function VComponent (type, props, children) {
		return {
	 		nodeType: 1,
	 		type: type || '',
	 		props: props || {},
	 		children: children || [],
	 		_el: null
	 	}; 
	}

	/**
	 * input stream factory
	 * 
	 * @param {string} input
	 */
	function Stream (input) {
	 	// peek at the next character
	 	function peek () {
	 		return input.charAt(pos);
	 	}

	 	// peek in any direction
	 	function lookout () {
	 		return input.charAt(pos-2);
	 	}

	 	// move on to the next character
	 	function next () {
	 		var char = input[pos++];

	 		if (char === '\n') {
	 			line++, col = 0;
	 		} else {
	 			col++;
	 		}

	 		return char;
	 	}

	 	// end of file
	 	function eof () {
	 		return peek() === '';
	 	}

	 	// throw error
	 	function panic (message) {
	 		throwError(message + ' (' + line + ':' + col + ')');
	 	}

	 	var pos = 0, line = 1, col = 0;

	 	return { 
	 		next:    next, 
	 		peek:    peek, 
	 		lookout: lookout, 
	 		eof:     eof, 
	 		panic:   panic 
	 	};
	}

	
	/**
	 * ---------------------------------------------------------------------------------
	 * 
	 * helpers
	 * 
	 * ---------------------------------------------------------------------------------
	 */

	/**
	 * push props
	 * 
	 * @param  {string} key  
	 * @param  {any}    value
	 * @param  {Object} props
	 */
	function pushProps (key, value, props) {
 		if (value === '' && boolProps.hasOwnProperty(key)) {
 			value = true;
 		}

		props[key] = value;
	}

	/**
	 * push children
	 * 
	 * @param  {VNode}   child  
	 * @param  {VNode[]} children
	 * @param  {Object}  props
	 */
	function pushChildren (child, children) {
		children[children.length] = child;
	}

	/**
	 * hoisted for in helper
	 * 
	 * @param  {Object}   subject 
	 * @param  {function} func
	 */
	function forIn (subject, func) {
		for (name in subject) {
			func(name, subject[name], subject);
		}
	}

	/**
	 * throw helper
	 * 
	 * @param  {string} message
	 */
	function throwError (message) {
		throw new Error(message);
	}


	/**
	 * ---------------------------------------------------------------------------------
	 * 
	 * stringify
	 * 
	 * ---------------------------------------------------------------------------------
	 */

	/**
	 * stringify vnode
	 * 
	 * @param  {number}   nodeType
	 * @param  {(string)} type
	 * @param  {Object[]} props
	 * @param  {VNode[]}  children
	 * @return {string}          
	 */
	function stringifyVNode (nodeType, type, props, children) {
		return ('{\n nodeType: '+nodeType+', type: '+type+', props: {'+props+'}, children: '+children+', _el: null}');
	}

	/**
	 * stringify props
	 * 
	 * @param  {Object} props
	 * @return {string}
	 */
	function stringifyProps (props) {
		var output = '', first = true;

		forIn(props, function (name, prop) {
			var value = '"' + name + '": ' + prop;

			output += first ? (first = false, value) : ', ' + value;
		});

		return output;
	}

	/**
	 * stringify children
	 * 
	 * @param  {number} nodeType
	 * @param  {array}  children
	 * @return {string}
	 */
	function stringifyChildren (nodeType, children) {
		return nodeType === 3 ? 
			'"' + children + '"': 
			'[' + children.map(function (child) { return stringifyAST(child); }).join(',') + ']';
	}

	/**
	 * stringify abstract syntax tree (AST)
	 * 
	 * @param  {Object} subject
	 * @return {string}
	 */
	function stringifyAST (subject) {
		var nodeType  = subject.nodeType,
			props     = stringifyProps(subject.props), 
			children  = stringifyChildren(nodeType, subject.children);

		var candidate = subject.type,
			type      = candidate.toLowerCase() === candidate ? ('"' + candidate + '"') : candidate;

		return stringifyVNode(nodeType, type, props, children);
	}


	/**
	 * ---------------------------------------------------------------------------------
	 * 
	 * parser
	 * 
	 * ---------------------------------------------------------------------------------
	 */
	

 	function parseStringToAST (str) {
 		var inElement      = false,  // everything between `<` and `/`
 			inTag          = false,  // everything between `<` and `>`
 			inProps        = false,  // everything between and `<tag ` and `>`
 			inChildren     = false,  // everything between > and /
 			inType         = false,  // everything between `<` and the first ` `
 			inText         = false,  // everything not of the above
 			result         = [],     // element store
 			arr            = [],     // buffer array of elements
 			current        = null,   // current element
 			level          = -1,
 			jsx            = false,
 			start          = '',
 			end            = '',
 			index          = 0;

 		var input  = Stream(str);
 		var output = '';

 		// while not end of file iterate through all the characters
         while (!input.eof()) {
         	var character = input.next();

         	if (character === '\t' || character === '\n') {
         		continue;
         	}

     		if (character === '<') {
     			// if the previous current element was a text node
     			// since text nodes do not have closing tags
     			// we close them when a new tag element is found
     			// which means we have to go back one level up the tree
     			if (inText) {
     				inText = false;
     				level--;
     			}

     			var nextCharacter = input.peek();

     			if (nextCharacter !== '/') {
     				// html comment
     				if (nextCharacter === '!') {
     					// traverse to end of html comment
     					while (!input.eof()) {
     						// end when we react closing tag
     						if (input.next() === '>') {
     							break;
     						}
     					}
     				} else {
     					// init element, props
     					inElement = inTag = true;

     					// encounter opening element identifier go one level down the tree
     					level++;

     					// create new element
     					// if nextCharater is uppercase VComponent, else VElement
     					current = (nextCharacter.toLowerCase() === nextCharacter ? VElement : VComponent)('', {}, []);

     					pushChildren(current, level === 0 ? result : arr[level - 1].children);

     					arr[level] = current;
     				}
     			}
     		} else if (character === '/') {
     			var nextCharacter = input.peek();

     			if (nextCharacter === '/') {
     				// traverse to end of line comment
     				while (!input.eof()) {
     					if (input.next() === '\n') {
     						// end when we react closing tag
     						break;
     					}
     				}
     			} else if (nextCharacter === '*') {
     				// traverse to end of block comment
     				while (!input.eof()) { 
     					if (input.next() === '/' && input.lookout() === '*') {
     						// end when we react closing tag
     						break;
     					}
     				}
     				// block comments
     			} else {
     				// exit element, tag and props
     				inElement = inTag = inProps = false;

     				// encounter closing element identifier, go one level up the tree
     				level--;

     				// traverse to the the closing tag
     				while (!input.eof()) {
     					if (input.next() === '>') {
     						// end when we react closing tag
     						break;
     					}
     				}
     			}
     		} else if (character === '>') {
     			// exit tag and props
     			inTag = inProps = false;
     		} else if (inTag && character === ' ') {
 				// init props
 				inProps = true;
     		} else if (inProps) {
     			// traverse and register all props
 				var char  = character, 
 					props = current.props, 
 					key   = '',
 					value = '',
 					side  = 0;

 				while (true) {
 					// side = 1 --> value, side = 0 ---> key
 					if (char === '=') {
 						side  = 1;
 					} else if (char === ' ') {
 						pushProps(key, value, props);

 						// new prop, reset
 						side  = 0;
 						key   = '',
 						value = '';
 					} else {
 						// key, value
 						if (side === 0) {
 							key   += char;
 						} else {
 							value += char;
 						}
 					}

 					// peek at next character
 					var next = input.peek();

 					// if next character is / or > ... end of tag
 					if (next === '/' || next === '>') {
 						if (key !== '') {
 							pushProps(key, value, props);
 						}

 						break;
 					}

 					char = input.next();
 				}
 			} else {
 				// element type
 				if (inTag) {
 					// // if first letter is uppercase, component
 					// if (current.type.length === 0 && character.toLowerCase() !== character) {
 					// 	current.nodeType = 2;
 					// }

 					current.type += character;
 				} else if (current !== null) {
 					if (inText) {
 						// push children to text node
 						current.children += character;
 					} else {								
 						inText = true;
 						level++;

 						// create new text node
 						current = VText(character);

 						pushChildren(current, level === 0 ? result : arr[level-1].children);

 						arr[level] = current;
 					}
 				}
 			}
         }

         return result;
 	}


 	/**
 	 * ---------------------------------------------------------------------------------
 	 * 
 	 * transformer
 	 * 
 	 * ---------------------------------------------------------------------------------
 	 */


 	/**
 	 * transpile input with jsx to js
 	 * 
 	 * @param  {string} input
 	 * @return {string}
 	 */
	function transpileJSX (input) {
		var output    = ''; // output string
		var line      = ''; // current line
		var blob      = ''; // blob of jsx string
		var jsx       = false;
		var previous  = '';

		// find jsx locations
		for (var i = 0, len = input.length; i < len; i++) {
			var char = input.charAt(i);

			// within jsx block
			if (jsx) {
				// if current === ')' and previous === '>'
				// end
				if (char === ')' && previous === '>') {
					jsx = false;
					output += '@jsx-placeholder' + char;

					var ast = parseStringToAST(blob);

					// console.log(ast);
					console.log(stringifyAST(ast[0]));
				}
				// else if (char !== '\n' && char !== '\t') {
				else {
					if (char !== '\t') {
						blob += char;

						// non whitespace previous character
						if (char !== ' ' && char !== '\n') {
							previous = char;
						}
					}
				}
			} 
			else if (!jsx) {
				// if current character === `<` and next character !== ' ' 
				// start jsx
				if (char === '<' && input[i+1] !== ' ') {
					jsx = true;
					blob = char;
				} else {
					output += char;
				}
			}
		}

		console.log(output+'');
	}

	/*
	{
	    nodeType: 1,
	    type: "div",
	    props: {
	        "class": "oh",
	        "checked": true
	    },
	    children: [{
	        nodeType: 1,
	        type: "p",
	        props: {
	            "class": {
	                name
	            }
	        },
	        children: [{
	            nodeType: 3,
	            type: "text",
	            props: {},
	            children: "hello world",
	            _el: null
	        }],
	        _el: null
	    }, {
	        nodeType: 2,
	        type: Component,
	        props: {},
	        children: [],
	        _el: null
	    }, {
	        nodeType: 3,
	        type: "text",
	        props: {},
	        children: "Hello World {this.state}",
	        _el: null
	    }, {
	        nodeType: 1,
	        type: "input",
	        props: {},
	        children: [],
	        _el: null
	    }],
	    _el: null
	}
	 */

	return {
		parse:     parseStringToAST,
		transpile: transpileJSX,
		stringify: stringifyAST
	};
}));