/**
 * tester runner
 *
 * excutes tests given an object describing the tests
 * based on sample input vs expected output
 * if output === expected output, test passed
 * else test failed
 *
 * log format
 *
 * ------
 *
 * Tests Passed #
 *
 * ...
 *
 * [Finnished In] #ms
 *
 * Tests Failed #
 *
 * ...
 *
 * [Finnished In] #ms
 */


var browser = self.window;
var jsx = browser ? self.jsx : require('../jsx.js');

/**
 * run tests
 * @return {Object} tests
 */
function run (tests, fn) {
	// return;
	var start = Date.now();

	var passed = [];
	var failed = [];

	var format = {
		reset: browser ? '' : '\x1b[0m',
		green: browser ? '' : '\x1b[32m',
		red: browser ? '' : '\x1b[31m',
		yellow: browser ? '' : '\x1b[33m',
		underline: browser ? '' : '\x1b[4m',
		dim: browser ? '' : '\x1b[2m',
		bold: browser ? '' : '\x1b[1m',
		clear: browser ? '' : '\x1Bc\n'
	};

	for (var name in tests) {
		var test = tests[name];

		var name = test.name;
		var sample = test.sample;
		var expected = test.expected.trim();

		var result = fn(sample).replace(/\n|\t/g, '')

		expected = expected.replace(/\n/g, '');
		expected = expected.replace(/\t/g, ' ');
		expected = expected.replace(/  +/g, ' ');
		expected = expected.replace(/ +\)/g, ')')
		expected = expected.replace(/\[ +/g, '[')

		if (result !== expected || /\n/g.test(result)) {
			// log why it failed

			console.log('failed: ', '\n\n')
			console.log(result)

			console.log('expected: ', '\n\n')
			console.log(expected)

			console.log('\n\n---------------\n\n');

			failed.push(name);
		} else {
			passed.push(name);
		}
	}

	var end = '\n\n'+format.reset+'[Finnished In] '+(Date.now()-start)+'ms\n';

	// start test logger
	console.log('\n------');

	// passed
	console.log(
		format.bold+'\nTests Passed '+passed.length+format.reset+format.green + '\n\n'+passed.join('\n')+end
	);

	// failed
	console.log(
		format.bold+'Tests Failed '+failed.length+format.reset+format.red +
		'\n\n'+(failed.join('\n') || 'no failed tests')+end
	);

	// if failed trigger exit
	if (failed.length) {
		if (browser) {
			console.error(new Error('^^^'));
		} else {
			process.exit(1);
		}
	}
}

run(spec, jsx);
