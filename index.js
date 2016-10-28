#!/usr/bin/env node

'use strict';

// imports
var fs    = require("fs");
var jsx   = require('./jsx.js');

// files, dir
var files = process.argv.slice(2);
var dir   = __dirname + '/';
var ext   = '.jsx.js';

// iterate through each file
for (var i = 0, len = files.length; i < len; i++) {
	var filename = files[i];
	use(dir + filename, filename.substr(0, filename.indexOf('.')) + ext);
}

// read file helper
function read (filepath) {
	try {
		return fs.readFileSync(filepath, "utf8");
	} catch (e) {
		return false;
	}
}

// console log helper
function log (message) {
	console.log(message);
}

// use the file to transpile
function use (filepath, filename) {
	var startTime  = Date.now();
	var text       = read(filepath);
	var transpiled = jsx.transpile(text);

	if (text !== false) {
		fs.writeFile(dir + filename, transpiled, function (err) {
		    if (err) { throw err; }

		    var endTime = Date.now();
		    log('[Finished in ' + (endTime - startTime) + 'ms]');
		}); 
	} else {
		log('no such file exits, ' + filepath);
	}
}