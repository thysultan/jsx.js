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
    

    var EMPTY = {value: true};
        EMPTY = Object.create(null, {
        area:   EMPTY,
        base:   EMPTY,
        br:     EMPTY,
        col:    EMPTY,
        embed:  EMPTY,
        hr:     EMPTY,
        img:    EMPTY,
        input:  EMPTY,
        keygen: EMPTY,
        link:   EMPTY,
        meta:   EMPTY,
        param:  EMPTY,
        source: EMPTY,
        track:  EMPTY,
        wbr:    EMPTY
    });

    var REG_JSX = /<([\w]+)[^\0]*?>[^\0]*?<\/\1>(?=\n\n+|;|\n+\)|\)\n\n+|\n+\t\))/g;

    var REG_SPACES      = /  +/g;
    var REG_PRAGMA      = /\/* +@jsx +(.*) +\*\//g;

    var START_TAG       = 1;
    var END_TAG         = 2;
    var TEXT            = 5;
    var LESS_THAN       = 60;
    var GREATER_THAN    = 62;
    var SPACE           = 32;
    var TAB             = 9;
    var NEW_LINE        = 10;
    var DBL_QOUTE       = 34;
    var SGL_QOUTE       = 39;
    var TMP_QOUTE       = 96;
    var OPEN_BRACKET    = 123;
    var CLOSE_BRACKET   = 125;
    var EQUALS          = 61;
    var DIVIDE          = 47;

    var COMPONENT       = 'VComponent';
    var TEXT            = 'VText';
    var ELEMENT         = 'VElement';

    var EMPTY_SHAPE     = vnode(0, '', {}, [], true, 0);


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

            for (var i = 0, l = children.length; i < l; i++) {
                output += ',' + '\n' + tabbed + this.node(children[i], node);
            }

            var tab = tabbed.substring(1);

            if (output) {
                output = output.substring(1);
                return children[0].nodeType !== 4 ? ', ['+output+'\n'+tab+'])' : ','+output;
            } else {
                return ', '+'null'+')';
            }
        },
        node: function (node, parent) {
            var indent   = node.indent;
            var nodeType = node.nodeType;
            var type     = this.type(node.type);
            var props    = this.props(node.props);
            var children = null;
            
            if (nodeType !== 4) {
                children = nodeType === 3 ? node.children : this.children(node.children, node);
            }

            switch (nodeType) {
                case 1: return this.element(type, props, children, node);
                case 2: return this.component(type, props, children, node);
                case 3: return this.text(children, node);
                case 4: {
                    children = node.children.replace(REG_JSX, finder);
                    children = children.substring(1, children.length-1).trim() + '\n' + tabs(indent-1) + ')';
                    
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
    

    function finder (match) {
        return stringify.node(parse(match), EMPTY_SHAPE);
    }

    function tabs (repeat) {
        return '\t'.repeat(repeat);
    }

    function push (node, level, result, stack) {
        (level === 0 ? result : stack[level - 1].children).push(node);
    }


    function vnode (nodeType, type, props, children, empty, indent) {
        return {
            nodeType: nodeType,
            type: type,
            props: props,
            children: children,
            empty: empty,
            indent: indent,
        };
    }

    function vtext (content) {
        return vnode(3, 'text', {}, content, true, 0);
    }


    /**
     * ---------------------------------------------------------------------------------
     * 
     * parser
     * 
     * ---------------------------------------------------------------------------------
     */
    

    function parse (str) {
        // convert spaces to tabs
        str = str.replace(REG_SPACES, '\t');

        var indent  = 0;
        var result  = [];
        var stack   = [];
        var current = null;
        var level   = -1;
        var context = 0;
        var len     = str.length;
        var i       = 0;

        // parse + compile
        while (i < len) {
            switch (str.charCodeAt(i)) {
                case NEW_LINE:
                case TAB:
                    break;
                case LESS_THAN:
                    context = START_TAG; 
                    break;
                case DIVIDE:
                    context = END_TAG; 
                    break;
                case OPEN_BRACKET: {
                    var block   = '';
                    var counter = 0;

                    while (i < len) {
                        switch (str.charCodeAt(i)) {
                            case OPEN_BRACKET:  counter++; break;
                            case CLOSE_BRACKET: counter--; break;
                        }
                        
                        block += str[i++];

                        if (counter === 0) {
                            break;
                        }
                    }

                    current.children.push(vnode(4, '@block', {}, block, false, indent));

                    break;
                }
                default: {
                    switch (context) {
                        case START_TAG: {
                            level++, indent++;
                            context = TEXT;
                            current = stack[level] = vnode(0, '', {}, [], false, indent);
                            i       = tag(i, len, str, current);

                            push(current, level, result, stack);

                            // if empty node revert level and indent
                            if (current.empty) {
                                level--, indent--;
                            }
                            
                            break;
                        } 
                        case END_TAG: {
                            level--, indent--;
                            current = stack[level];
                            i       = sleep(i, len, str, GREATER_THAN);

                            break;
                        }
                        case TEXT: {
                            i = text(i, len, str, current);

                            break;
                        }
                    }
                }
            }

            i++;
        }

        return result[0];
    }

    function tag (i, len, str, node) {
        var type     = '';
        var props    = {};
        var empty    = false;
        var nodeType = 0;

        var assign   = false;
        var name     = '';
        var value    = '';
        var qoute    = 0;

        // untill a closing tag >
        while (i < len) {
            var code = str.charCodeAt(i);

            if (code === GREATER_THAN && qoute === 0) {
                if (nodeType === 0) {
                    type = name;
                    nodeType = type.toLowerCase() === type ? 1 : 2;
                } else {
                    name && (props[name] = value || true); 
                }
                break;
            } else {
                // prop value
                if (code === EQUALS) {
                    assign = true;
                }
                // new prop
                else if (qoute === 0 && (code === SPACE || code === NEW_LINE || code === TAB)) {
                    if (nodeType === 0) {
                        type = name;
                        nodeType = type.toLowerCase() === type ? 1 : 2;
                    } else {
                        if (value.charCodeAt(0) === OPEN_BRACKET) {
                            value = value.substring(1, value.length-1);
                            props[name] = string(value, false);
                        } else {
                            props[name] = string(value || 'true', true);
                        }
                    }

                    // prop name
                    assign = false;
                    name = value = '';
                }
                else if (code === SGL_QOUTE || code === DBL_QOUTE || code === TMP_QOUTE) {
                    qoute = qoute !== 0 && code === qoute ? 0 : code;
                }
                else if (code === OPEN_BRACKET) {
                    i++;

                    while (i < len) {                        
                        if (str.charCodeAt(i) === CLOSE_BRACKET) {
                            break;
                        }

                        value += str[i++];
                    }

                    props[name] = string(value.trim(), false);

                    assign = false;
                    name = value = '';
                }
                // empty element
                else if (code === DIVIDE && qoute === 0 && assign === false) {
                    empty = true;
                }
                else {
                    assign ? value += str[i] : name += str[i];
                }
            }

            i++;
        }

        // assign to node
        node.nodeType = nodeType;
        node.type     = nodeType === 2 ? type : '\'' + type + '\'';
        node.props    = props;
        node.empty    = EMPTY[type] || empty;

        return i;
    }

    function string (content, type) {
        return type ? '\''+content.trim()+'\'' : content;
    }

    function text (i, len, str, node) {
        var line  = '';
        var arr   = [];
        var index = 0;

        // untill an opening tag <
        while (i < len) {
            var code = str.charCodeAt(i);

            if (code === LESS_THAN) {
                break;
            }
            else if (code === OPEN_BRACKET) {
                if (line) {
                    arr[index++] = string(line, true);
                    line = '';
                }
            } 
            else if (code === CLOSE_BRACKET) {
                // {javascript}
                arr[index++] = string(line, false);
                line = '';
            }
            else {
                line += str[i];
            }

            i++;
        }

        if (line) {
            // last text node
            arr[index++] = string(line, true);
        }

        // assign to node children of text nodes
        node.children = arr.map(vtext);

        return i;
    }

    function sleep (i, len, str, code) {
        // sleep untill the `code` character
        while (i < len) {
            if (str.charCodeAt(i) === code) {
                break;
            }

            i++;
        }

        return i;
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
                TEXT      = '';
                COMPONENT = ELEMENT = extend;
            }
        } else {
            var pragma = REG_PRAGMA.exec(input);
            
            if (pragma) {
                TEXT      = '';
                COMPONENT = ELEMENT = pragma[1];
            }
        }

        return input.replace(REG_JSX, finder);
    }

    return jsx;
}));