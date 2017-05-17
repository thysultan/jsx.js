/*!
 *        _
 *       (_)_____  __
 *      / / ___/ |/_/
 *     / (__  )>  <
 *  __/ /____/_/|_|
 * /___/
 *
 *
 * an extendable and lightweight jsx compiler
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


	/**
	 * ---------------------------------------------------------------------------------
	 *
	 * constants
	 *
	 * ---------------------------------------------------------------------------------
	 */

	var EMPTY = {
		area: true,
		base: true,
		br: true,
		col: true,
		embed: true,
		hr: true,
		img: true,
		input: true,
		keygen: true,
		link: true,
		meta: true,
		param: true,
		source: true,
		track: true,
		wbr: true
	}

	var REG_PRAGMA = /\/* +@jsx +(.*) +\*\//g;

	var TEXT = 5;
	var OPEN = 60;
	var CLOSE = 62;
	var SPACE = 32;
	var TAB = 9;
	var NEWLINE = 10;
	var DQOUTE = 34;
	var SQOUTE = 39;
	var TQOUTE = 96;
	var LEFTPAREN = 123;
	var RIGHTPAREN = 125;
	var EQUAL = 61;
	var SLASH = 47;

	var COMPONENT = 'h';
	var TEXT = '';
	var ELEMENT = 'h';

	/**
	 * ---------------------------------------------------------------------------------
	 *
	 * stringify
	 *
	 * ---------------------------------------------------------------------------------
	 */

	var stringify = {
		element: function (type, props, children, node) {
			return ELEMENT+'('+type+', '+props+children;
		},
		component: function (type, props, children, node) {
			return COMPONENT+'('+type+', '+props+children;
		},
		text: function (children, node) {
			return TEXT ? TEXT+'('+children+')' : children;
		},
		type: function (type, node) {
			return type;
		},
		props: function (props, node) {
			var output = '', first = true;

			for (var name in props) {
				var prop = props[name];
				var value = name+': '+prop;
				output += first ? (first = false, value) : ', ' + value;
			}

			return output ? '{'+output+'}' : 'null';
		},
		children: function (children, node) {
			var output = '';
			var tabbed = tabs(node.indent);
			var newline = '\n';

			for (var i = 0, l = children.length; i < l; i++) {
				var child = children[i];
				var tail = this.node(children[i], node);
				var body = '';

				switch (child.flag) {
					case 4: {
						body = ' '+ tail;
						break;
					}
					case 3: {
						if (node.children.length < 60) {
							body = tail;
							newline = '';
							break;
						}
					}
					default: {
						body = '\n' + tabbed + tail;
					}
				}

				output += (i !== 0 ? ',' : '') + body;
			}

			if (output) {
				tabbed = tabbed.substring(1);
				output = output.substring(0);
				return children[0].flag !== 4 ? ', '+output+newline+tabbed+')' : ','+output;
			} else {
				return ')';
			}
		},
		node: function (node) {
			var indent = node.indent;
			var flag = node.flag;
			var type = this.type(node.type);
			var props = this.props(node.props);
			var children = null;

			if (flag !== 4) {
				children = flag === 3 ? node.children : this.children(node.children, node);
			}

			switch (flag) {
				case 1: return this.element(type, props, children, node);
				case 2: return this.component(type, props, children, node);
				case 3: return this.text(children, node);
				case 4: {
					children = parse(node.children);
					children += tabs(indent-1) + ')';

					return children;
				}
			}
		}
	};

	/**
	 * ---------------------------------------------------------------------------------
	 *
	 * helpers
	 *
	 * ---------------------------------------------------------------------------------
	 */

	function tabs (repeat) {
		return '\t'.repeat(repeat);
	}

	function push (node, level, result, stack) {
		(level === 0 ? result : stack[level - 1].children).push(node);
	}

	function vnode (flag, type, props, children, empty, indent, parent) {
		return {
			flag: flag,
			type: type,
			props: props,
			children: children,
			empty: empty,
			indent: indent,
			parent: parent
		};
	}

	function vtext (content, parent) {
		return vnode(3, 'text', {}, content, true, 0, parent);
	}

	/**
	 * ---------------------------------------------------------------------------------
	 *
	 * parser
	 *
	 * ---------------------------------------------------------------------------------
	 */

	function parse (input) {
		var start = input.search(/<([\w]+)[^]*?\>/);

		if (start < 0) {
			return input;
		}

		var caret = start;
		var indent = 0;
		var i = caret;
		var level = -1;
		var context = 0;
		var index = 0;
		var chars = '';
		var length = input.length;

		var current = null;
		var children = null;
		var array = null;

		var heap = [];
		var stack = [];

		tabIndex: while (caret > 0) {
			switch (input.charCodeAt(caret--)) {
				case 10: {
					break tabIndex;
				}
				case 9: indent++;
			}
		}

		astGenerator: while (i < length) {
			switch (input.charCodeAt(i)) {
				case SPACE: case NEWLINE: case TAB: {
					sleep: while (i < length) {
						switch (input.charCodeAt(i)) {
							case NEWLINE: case TAB: case SPACE: break;
							default: break sleep;
						}
						i++;
					}
					continue;
				}
				case OPEN: context = OPEN; break;
				case SLASH: context = CLOSE; break;
				case LEFTPAREN: {
					var block = '';
					var counter = 1;

					i++;

					escape: while (i < length) {
						switch (input.charCodeAt(i)) {
							case LEFTPAREN: counter++; break;
							case RIGHTPAREN: counter--; break;
						}

						switch (counter) {
							case 0: {
								i++;
								break escape;
							}
							default: {
								block += input.charAt(i++);
							}
						}
					}

					current.children.push(vnode(4, '', {}, block, false, indent, current));
					break;
				}
				default: {
					switch (context) {
						case OPEN: {
							current = vnode(0, '', {}, [], false, ++indent, current);
							stack[++level] = current;
							i = tag(i, length, input, current) + 1;

							push(current, level, heap, stack);

							// self closing node revert
							if (current.empty === true) level--, indent--;

							sleep: while (i < length) {
								switch (input.charCodeAt(i)) {
									case NEWLINE: case TAB: case SPACE: break;
									default: break sleep;
								}
								i++;
							}

							context = TEXT;
							continue;
						}
						case CLOSE: {
							current = stack[(indent--, --level)];

							sleep: while (i < length) {
								switch (input.charCodeAt(i)) {
									case CLOSE: break sleep;
								}
								i++;
							}

							sleep: while (i < length) {
								switch (input.charCodeAt(i++)) {
									case NEWLINE: case TAB: case SPACE: break;
									default: break sleep;
								}
							}

							if (current === void 0) {
								break astGenerator;
							}

							continue;
						}
						case TEXT: {
							chars = '';
							index = 0;
							array = [];

							text: while (i < length) {
								switch (input.charCodeAt(i)) {
									case OPEN: {
										break text;
									}
									case LEFTPAREN: {
										if (chars.length > 0) {
											array.push(string(chars, true));
											chars = '';
										}
										break;
									}
									case RIGHTPAREN: {
										array.push(string(chars, false));
										chars = '';
										break;
									}
									default: {
										chars += input.charAt(i);
									}
								}
								i++;
							}

							// last text node
							if (chars.length > 0) {
								array.push(string(chars, true));
							}

							for (index = 0, children = current.children; index < array.length; index++) {
								children.push(vtext(array[index], current));
							}

							break;
						}
					}
				}
			}

			i++;
		}

		var head = input.substring(0, start);
		var body = stringify.node(heap[0]);
		var tail = parse(input.substring(i));

		return head + body + tail;
	}

	function tag (i, length, str, node) {
		var type = '';
		var props = {};
		var empty = false;
		var flag = 0;
		var assign = false;
		var name = '';
		var value = '';
		var qoute = 0;

		// until a closing tag >
		while (i < length) {
			var code = str.charCodeAt(i);

			if (code === CLOSE && qoute === 0) {
				if (flag === 0) {
					type = name;
					flag = type.toLowerCase() === type ? 1 : 2;
				} else {
					if (name.length > 0) {
						if (value.length === 0) {
							value = true;
						}

						props[name] = value.charCodeAt(0) === 39 ? value : "'"+value+"'";
					}

				}
				break;
			} else {
				// prop value
				if (code === EQUAL) {
					assign = true;
				}
				// new prop
				else if (qoute === 0 && (code === SPACE || code === NEWLINE || code === TAB)) {
					if (flag === 0) {
						type = name;
						flag = type.toLowerCase() === type ? 1 : 2;
					} else {
						if (value.charCodeAt(0) === LEFTPAREN) {
							value = value.substring(1, value.length-1);
							props[name] = string(value, false);
						} else if (name.length > 0) {
							props[name] = string(value || 'true', true);
						}
					}

					// prop name
					assign = false;
					name = value = '';
				}
				else if (code === SQOUTE || code === DQOUTE || code === TQOUTE) {
					value += "'";

					if (qoute !== 0 && code === qoute) {
						qoute = 0;
					} else {
						qoute = code;
					}
				}
				else if (code === LEFTPAREN) {
					i++;

					escape: while (i < length) {
						switch (str.charCodeAt(i)) {
							case RIGHTPAREN: break escape;
							default: value += str.charAt(i++);
						}
					}

					props[name] = string(value.trim(), false);

					assign = false;
					name = value = '';
				}
				// empty element
				else if (code === SLASH && qoute === 0 && assign === false) {
					empty = true;
				}
				else {
					assign ? value += str[i] : name += str[i];
				}
			}

			i++;
		}

		// assign to node
		node.flag = flag;
		node.type = flag === 2 ? type : '\'' + type + '\'';
		node.props = props;
		node.empty = EMPTY[type] || empty;

		return i;
	}

	function string (content, type) {
		return type ? '\''+content.trim()+'\'' : content;
	}

	function jsx (input, extend) {
		if (extend) {
			if (typeof extend === 'object') {
				for (var name in extend) {
					var value = extend[name];

					if (typeof value === 'string') {
						switch (value) {
							case 'component': COMPONENT = value; break;
							case 'element': ELEMENT = value; break;
							case 'text': TEXT = value; break;
						}
					} else {
						stringify[name] = value;
					}
				}
			} else {
				TEXT = '';
				COMPONENT = ELEMENT = extend;
			}
		} else {
			var pragma = REG_PRAGMA.exec(input);

			if (pragma) {
				TEXT = '';
				COMPONENT = ELEMENT = pragma[1];
			}
		}

		return parse(input);
	}

	return jsx;
}));
