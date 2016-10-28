/*!
 *        _          
 *       (_)_____  __
 *      / / ___/ |/_/
 *     / (__  )>  <  
 *  __/ /____/_/|_|  
 * /___/ 
 *
 * 
 * Jsx.js is an extendable and lightweight jsx parser without regex
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

	var VHelpers    = VFactory(),

		VText       = VHelpers.VText,
		VElement    = VHelpers.VElement,
		VComponent  = VHelpers.VComponent,
		VProps      = VHelpers.VProps,

		emptyObject = {},
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
	

	function VFactory () {
		return {
			/**
			 * vtext factory
			 * 
			 * @param {string} children
			 */
			VText: function VText (children) {
			 	return {
			 		nodeType: 3,
			 		type: 'text',
			 		props: emptyObject,
			 		children: children || '',
			 		_el: null
			 	};
			},

			/**
			 * vnode factory
			 * 
			 * @param {string}  type
			 * @param {Object}  props
			 * @param {VNode[]} children
			 */
			VElement: function VElement (type, props, children) {
			 	return {
			 		nodeType: 1,
			 		type: type || '',
			 		props: props || {},
			 		children: children || [],
			 		_el: null
			 	};
			},

			/**
			 * vcomponent factory 
			 * 
			 * @param {string}  type
			 * @param {Object}  props
			 * @param {VNode[]} children
			 */
			VComponent: function VComponent (type, props, children) {
				return {
			 		nodeType: 1,
			 		type: type || '',
			 		props: props || {},
			 		children: children || [],
			 		_el: null
			 	}; 
			},

			/**
			 * push props
			 * 
			 * @param  {string} key  
			 * @param  {any}    value
			 * @param  {Object} props
			 */
			VProps: function VProps (key, value, props, node) {
				props[key] = value;
			}
		}
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

	 	// ignore everything until a certain point
	 	function sleep (character, previous) {
	 		if (previous === void 0) {	 			
	 			while (!eof()) {
	 				if (next() === character) {
	 					break;
	 				}
	 			}
	 		} else {
	 			while (!eof()) { 
 					if (next() === character && lookout() === previous) {
 						break;
 					}
 				}
	 		}
	 	}

	 	var pos = 0, line = 1, col = 0;

	 	return { 
	 		next:    next, 
	 		peek:    peek, 
	 		lookout: lookout, 
	 		eof:     eof,
	 		sleep:   sleep,
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
	 * pushs vnode to children stack
	 * 
	 * @param  {VNode}   child  
	 * @param  {number}  level
	 * @param  {VNode[]} result 
	 * @param  {VNode[]} levelsArr
	 */
	function pushProps (key, value, props, node) {
		if (value === '' && boolProps.hasOwnProperty(key)) {
			value = true;
		}

		VProps(key, value, props, node);
	}

	/**
	 * pushs vnode to children stack
	 * 
	 * @param  {VNode}   child  
	 * @param  {number}  level
	 * @param  {VNode[]} result 
	 * @param  {VNode[]} levelsArr
	 */
	function pushChildren (child, result, level, levelsArr) {
		var destination = level === 0 ? result : levelsArr[level - 1].children;

		destination[destination.length] = child;
	}

	/**
	 * hoisted for in helper
	 * 
	 * @param  {Object}   subject 
	 * @param  {function} func
	 */
	function forIn (subject, func) {
		for (var name in subject) {
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
		return '{nodeType:'+nodeType+',type:'+type+',props:{'+props+'},children:'+children+',_el:null}';
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
		if (nodeType === 3) {
			if (children.charAt(0) === '{') {
				// js scope
				return children.substr(1,children.length-2);
			} else {
				// plain string
				return '"' + children + '"';
			}
		} else {
			return "[" + children.map(function (child) { return stringifyAST(child); }).join(',') + ']';
		}
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
 			inText         = false,  // everything not of the above
 			result         = [],     // element store
 			levelsArr      = [],     // buffer array of elements indexed by level
 			current        = null,   // current element
 			level          = -1;

 		var input  = Stream(str);

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
     					// sleep untill
     					input.sleep('>');
     				} else {
     					// init element, props
     					inElement = inTag = true;

     					// encounter opening element identifier go one level down the tree
     					level++;

     					// create new element, if nextCharater is uppercase VComponent, else VElement
     					current = (nextCharacter.toLowerCase() === nextCharacter ? VElement : VComponent)('', {}, []);

     					// push element to children stack
     					pushChildren(current, result, level, levelsArr);

     					// push new level
     					levelsArr[level] = current;
     				}
     			}
     		} else if (character === '/') {
     			var nextCharacter = input.peek();

     			if (nextCharacter === '/') {
     				// sleep untill
     				input.sleep('\n');
     			} else if (nextCharacter === '*') {
     				// block comments
     				// sleep untill the previous and next character are the following
     				input.sleep('/', '*');
     			} else {
     				// exit element, tag and props
     				inElement = inTag = inProps = false;

     				// encounter closing element identifier, go one level up the tree
     				level--;

     				// traverse to the the closing tag
     				input.sleep('>');
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
 						pushProps(key, value, props, current);

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

 					// end of props if next character is > or current is / and next is >
 					// this handles both
 					// <input /> and <input >
 					if (next === '>' || (current === '/' && next === '>')) {
 						if (key !== '') {
 							pushProps(key, value, props, current);
 						}

 						break;
 					}

 					char = input.next();
 				}
 			} else {
 				// element type
 				if (inTag) {
 					current.type += character;
 				} else if (current !== null) {
 					if (inText) {
 						if (character === '{') {
 							var chars = character;

 							// sleep untill end of sleeping text
 							while (!input.eof()) {
 								var char = input.next();

 								chars += char;

 								if (char === '}') {
 									// push text node to children stack
 									pushChildren(VText(chars), result, level, levelsArr);
 									break;
 								}		
 							}
 						} else {
 							// push children to text node
 							current.children += character;
 						}
 					} else {
 						inText = true;
 						level++;

 						// create new text node
 						current = VText(character);

 						// push element to children stack
 						pushChildren(current, result, level, levelsArr);

 						// push new level
 						levelsArr[level] = current;
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
		var blob      = ''; // blob of jsx string
		var jsx       = false;
		var previous  = '';

		// find jsx locations
		for (var i = 0, len = input.length; i < len; i++) {
			var char = input.charAt(i);

			// within jsx block
			if (jsx) {
				if (char === ')' && previous === '>') {
					jsx = false;
					output += '(' + stringifyAST(parseStringToAST(blob)[0]) + ')' + char;
				} else {
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
				var next = input.charAt(i+1);

				// if current character `<` and next character not ' ' && '!' start jsx
				if (char === '<' && next !== ' ' && next !== '!') {
					jsx = true;
					blob = char;
				} else {
					output += char;
				}
			}
		}

		return output;
	}


	/**
	 * ---------------------------------------------------------------------------------
	 * 
	 * extend
	 * 
	 * ---------------------------------------------------------------------------------
	 */
	

	/**
	 * allows us to inject a function used 
	 * to construct the structure of a VNode object
	 *  
	 * @param  {Object} subject
	 */
	function extendVNode (subject) {
		if (subject.text) {
			VText = subject.text;
		}

		if (subject.component) {
			VComponent = subject.component;
		}

		if (subject.element) {
			VElement = subject.element;
		}
	}


	/**
	 * ---------------------------------------------------------------------------------
	 * 
	 * exports
	 * 
	 * ---------------------------------------------------------------------------------
	 */
	

	return {
		parse:     parseStringToAST,
		transpile: transpileJSX,
		stringify: stringifyAST,
		extend:    extendVNode
	};
}));