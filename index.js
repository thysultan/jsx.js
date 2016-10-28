#!/usr/bin/env node

'use strict';

// imports
var fs    = require("fs");
var jsx   = require('./jsx.js');

// files, dir
var files = process.argv.slice(2);
var dir   = __dirname + '/';

// iterate through each file
for (var i = 0, len = files.length; i < len; i++) {
	use(dir + files[i]);
}

// read file helper
function read (filepath) {
	try {
		return fs.readFileSync(filepath, "utf8");
	} catch (e) {
		return false;
	}
}

// use the file to transpile
function use (filepath) {
	var text = read(filepath);

	if (text !== false) {
		// console.log(text, jsx.transpile(text));
	} else {
		console.log('no such file exits, ' + filepath);
	}
}