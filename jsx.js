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


    // regular expressions
    var regJsx     = /(.?|\(\n.*)(<[\w][^\0]*?[^\/]>[^\0]*?<\/.*>)(\n\n|\)\n\n|\);|\n\)|;|\n\}| }|}\n|.*\n.\);|.*\n.\))/g;
    var regSpace   = /  /g;

    var VHelpers   = factory();

    // VNode constructors
    var VText      = VHelpers.VText;
    var VElement   = VHelpers.VElement;
    var VComponent = VHelpers.VComponent;
    var VProps     = VHelpers.VProps;
    var VNode      = VHelpers.VNode;

    // pragma
    var pragma     = false;

    var _txPragma  = 'VText';
    var _elPragma  = 'VElement';
    var _cmPragma  = 'VComponent';

    var regPragma  = /\/\* +?@jsx +?(.+) \*\//g;
    var txPragma   = _txPragma;
    var elPragma   = _elPragma;
    var cmPragma   = _cmPragma;

    // boolean attributes
    var boolAttr   = {
        async:    true,  autofocus:  true,  autoplay:  true,  checked:    true,  allowFullscreen: true,   
        controls: true,  declare:    true,  default:   true,  multiple:   true,  defaultMuted:    true,     
        defer:    true,  disabled:   true,  draggable: true,  enabled:    true,  formNoValidate:  true,   
        inert:    true,  isMap:      true,  itemScope: true,  loop:       true,  defaultChecked:  true,         
        noShade:  true,  noValidate: true,  noWrap:    true,  open:       true,  pauseOnExit:     true,      
        reversed: true,  scoped:     true,  seamless:  true,  selected:   true,  typeMustMatch:   true,        
        sortable: true,  visible:    true,  trueSpeed: true,  noResize:   true,  indeterminate:   true, 
        noHref:   true,  required:   true,  translate: true,  spellcheck: true,  defaultSelected: true,
        compact:  true,  hidden:     true,  muted:     true,  readOnly:   true
    };


    /**
     * ---------------------------------------------------------------------------------
     * 
     * factories
     * 
     * ---------------------------------------------------------------------------------
     */
    

    function factory () {
        return {
            /**
             * text node constructor
             * 
             * @param {string} children
             */
            VText: function VText (children) {
                return {
                    nodeType: 3,
                    type: 'text',
                    props: {},
                    children: children || '',
                };
            },

            /**
             * element node constructor
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
                    children: children || []
                };
            },

            /**
             * component node constructor 
             * 
             * @param {string}  type
             * @param {Object}  props
             * @param {VNode[]} children
             */
            VComponent: function VComponent (type, props, children) {
                return {
                    nodeType: 2,
                    type: type || '',
                    props: props || {},
                    children: children || []
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
            },

            /**
             * stringify VNode
             * 
             * @param  {number}   nodeType
             * @param  {(string)} type
             * @param  {Object[]} props
             * @param  {VNode[]}  children
             * @return {string}          
             */
            VNode: function VNode (type, props, children, nodeType) {
                if (nodeType === 3) {
                    return pragma ? children : txPragma+'('+children+')';
                }

                var _props = props ? '{' + props + '}' : 'null';
                var _children = children ? '['+children.trim()+']' : 'null';

                if (nodeType === 1) {
                    return elPragma + '(' + type + ', ' + _props +', ' + _children + ')';
                } else {
                    return cmPragma + '(' + type + ', ' + _props +', ' + _children + ')';
                }
            }
        }
    }


    /**
     * input stream factory
     * 
     * @param  {string} input
     * @return {Object}
     */
    function input (str) {
        // peek at the next character
        function peek () {
            return str[pos];
        }

        // move on to the next character
        function next () {
            return str[pos++];
        }

        // end of file
        function eof () {
            return pos === length;
        }

        // ignore everything until a certain point
        function sleep (character, previous) {
            if (previous === void 0) {              
                while (pos !== length) {
                    if (str[pos++].charCodeAt(0) === character) {
                        break;
                    }
                }
            } else {
                while (pos !== length) { 
                    if (str[pos++].charCodeAt(0) === character && str[pos-2].charCodeAt(0) === previous) {
                        break;
                    }
                }
            }
        }

        var pos = 0, length = str.length-1;

        return {next: next, peek: peek, eof: eof, sleep: sleep};
    }

    
    /**
     * ---------------------------------------------------------------------------------
     * 
     * helpers
     * 
     * ---------------------------------------------------------------------------------
     */


    /**
     * push props to vnode
     * 
     * @param  {string}  key  
     * @param  {any}     value
     * @param  {Object}  props 
     * @param  {VNode}   node
     */
    function pushProp (key, value, props, node) {
        if (value === '' && boolAttr[key]) {
            value = true;
        } else if (value.charAt(0) === '{') {
            value = value.substr(1, value.length-2);
        }


        VProps(key, value, props, node);
    }

    /**
     * push vnodes to children stack
     * 
     * @param  {VNode}   child  
     * @param  {VNode[]} result 
     * @param  {number}  level
     * @param  {VNode[]} stack
     */
    function pushChild (child, result, level, stack) {
        var destination = level === 0 ? result : stack[level - 1].children;

        destination[destination.length] = child;
    }


    /**
     * ---------------------------------------------------------------------------------
     * 
     * stringify
     * 
     * ---------------------------------------------------------------------------------
     */
    

    /**
     * stringify props
     * 
     * @param  {Object} props
     * @return {string}
     */
    function strProps (props) {
        var output = '', first = true;

        for (var name in props) {
            var prop = props[name];
            var value = "'" + name + "': " + prop;

            output += first ? (first = false, value) : ', ' + value;
        }

        return output;
    }


    /**
     * stringify children
     * 
     * @param  {number} nodeType
     * @param  {array}  children
     * @return {string}
     */
    function strChildren (nodeType, children) {
        if (nodeType === 3) {
            if (children.charAt(0) === '{') {
                // js scope
                return children.substr(1, children.length-2);
            } else {
                // plain string
                return "'" + children + "'";
            }
        } else {
            var length = children.length;
            var _children = '';

            for (var i = 0; i < length; i++) {
                _children += (i === 0 ? '' : ',') + strNode(children[i]);
            }

            return _children;
        }
    }


    /**
     * stringify abstract syntax tree (AST)
     * 
     * @param  {Object} subject
     * @return {string}
     */
    function strNode (subject) {
        var nodeType  = subject.nodeType;
        var props     = strProps(subject.props);
        var children  = strChildren(nodeType, subject.children);

        var candidate = subject.type;
        var type      = candidate.toLowerCase() === candidate ? ("'" + candidate + "'") : candidate;

        return VNode(type, props, children, nodeType);
    }


    /**
     * ---------------------------------------------------------------------------------
     * 
     * parser
     * 
     * ---------------------------------------------------------------------------------
     */
    

    /**
     * parse string to ast
     * 
     * @param  {string} str
     * @return {Any[VNode]}    
     */
    function parse (str) {
        var inElem    = false;  // everything between `<` and `/`
        var inTag     = false;  // everything between `<` and `>`
        var inProps   = false;  // everything between `<tag ` and `>`
        var inText    = false;  // everything not of the above
        var result    = [];     // element store
        var stack     = [];     // buffer array of elements indexed by level
        var current   = null;   // current element
        var level     = -1;     // level in the tree

        var stream = input(str);
        var next   = stream.next;
        var peek   = stream.peek;
        var sleep  = stream.sleep;
        var eof    = stream.eof;

        while (!eof()) {
            var character = next();
            var code = character.charCodeAt(0);

            // ` `
            if (code === 32 && peek().charCodeAt() === 32) {
                continue;
            }

            // \t, \n
            if (code === 9 || code === 10) {
                continue;
            }

            // <
            if (code === 60) {
                // if the previous current element was a text node
                // since text nodes do not have closing tags
                // we close them when a new tag element is found
                // which means we have to go back one level up the tree
                if (inText) {
                    inText = false;
                    level--;
                }

                var nextchar = peek();
                var nextcode = nextchar.charCodeAt(0);

                // /
                if (nextcode !== 47) {
                    // html comment
                    if (nextcode === 33) {
                        // sleep untill > character
                        sleep(62);
                    } else {
                        // init element, props
                        inElem = inTag = true;

                        // encounter opening element identifier go one level down the tree
                        level++;

                        // create new element, if nextCharater is uppercase VComponent, else VElement
                        current = (nextchar.toLowerCase() === nextchar ? VElement : VComponent)('', {}, []);

                        // push element to children stack
                        pushChild(current, result, level, stack);

                        // push new level
                        stack[level] = current;
                    }
                }
            } 
            // /
            else if (code === 47) {
                var nextchar = peek();
                var nextcode = nextchar.charCodeAt(0);

                // /
                if (nextcode === 47) {
                    // sleep untill \n
                    sleep(10);
                } 
                // *
                else if (nextcode === 42) {
                    // block comments
                    // sleep until the previous and next character are '/' and '*'
                    sleep(47, 42);
                } 
                else {
                    // exit element, tag and props
                    inElem = inTag = inProps = false;

                    // encounter closing element identifier, go one level up the tree
                    level--;

                    // traverse to the the closing tag '>'
                    sleep(62);
                }
            } 
            // > 
            else if (code === 62) {
                // exit tag and props
                inTag = inProps = false;
            }
            // ` ` 
            else if (inTag && code === 32) {
                // init props
                inProps = true;
            } 
            else if (inProps) {
                // traverse and register all props
                var char  = character;
                var props = current.props;
                var key   = '';
                var value = '';

                // side = false --> value, side = true ---> key
                var side = true;

                while (true) {
                    var _code = char.charCodeAt(0);

                    // =
                    if (_code === 61) {
                        side = false;
                    }
                    // ` ` 
                    else if (_code === 32) {
                        pushProp(key, value, props, current);

                        // new prop, reset
                        side = true; key = value = '';
                    } else {
                        // key, value
                        side ? key += char : value += char;
                    }

                    // peek at next character
                    var nextcode = peek().charCodeAt(0);

                    // end of props if next character is > or current is / and next character is >
                    // this handles both
                    // <input /> and <input>
                    // >, /, >
                    if (nextcode === 62 || (_code === 47 && nextcode === 62)) {
                        if (key !== '' && key !== '/') {
                            pushProp(key, value, props, current);
                        }

                        break;
                    }

                    char = next();
                }
            } 
            else {
                // element type
                if (inTag) {
                    current.type += character;
                } else if (current !== null) {
                    if (inText) {
                        if (character === '{') {
                            var chars = character;

                            // sleep until end }
                            while (!eof()) {
                                var char = next();

                                chars += char;

                                // }
                                if (char.charCodeAt(0) === 125) {
                                    // push text node to children stack
                                    pushChild(VText(chars), result, level, stack);
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
                        pushChild(current, result, level, stack);

                        // push new level
                        stack[level] = current;
                    }
                }
            }
        }

        return result;
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
     * @param  {Object<string, function>} subject
     */
    function extender (subject) {
        subject.text && (VText = subject.text);
        subject.component && (VComponent = subject.component);
        subject.element && (VElement = subject.element);
        subject.props && (VProps = subject.props);
        subject.stringify && (VNode = subject.stringify);
    }


    /**
     * ---------------------------------------------------------------------------------
     * 
     * transformer
     * 
     * ---------------------------------------------------------------------------------
     */


    /**
     * transpiler
     * 
     * @param  {string} match
     * @param  {string} group1
     * @param  {string} group2
     * @param  {string} group3
     * @return {string}        
     */
    function transpiler (match, group1, group2, group3) {
        return group1 + strNode(parse(group2.replace(regSpace, ''))[0]) + group3;
    }


    /**
     * ---------------------------------------------------------------------------------
     * 
     * exports
     * 
     * ---------------------------------------------------------------------------------
     */
    

    /**
     * jsx
     * 
     * @param  {string} str
     * @param  {(undefined|Object<string, function>)} extend
     * @return {string}
     */
    return function jsx (str, extend) {
        if (extend !== void 0) {
            extender(extend);
        }

        var custom = regPragma.exec(str);

        if (custom !== null) {
            pragma   = true;
            cmPragma = elPragma = custom[1];
            txPragma = '';
        }

        return str.replace(regJsx, transpiler);
    }
}));