/**
 * define tests
 * @type {Object}
 */
self.spec = {
// 	'finder': {
// 		name: 'finder',
// 		sample: `
// var a = <div><div>text</div></div>;
// var a = <div><div>text</div></div>
// return <B key="b"><A /></B>
// return <div key="a">A</div>
// 		`,
// 		expected: `

// return h(B, {key: 'b'}, h(A, null))
// return h(B, {key: 'b'}, A)

// 		`
// 	},
	// template: {
	// 	name: 'template',
	// 	sample: ``,
	// 	expected: `
	// 	`
	// },

	simple_0: {
		name: 'simple_0',
		sample: `
var a = <div><div>text</div></div>;
var a = <div><div>text</div></div>
		`,
		expected: `
var a = h('div', null,
	h('div', null,
		'text'
	)
);

var a = h('div', null,
	h('div', null,
		'text'
	)
)`
	},

	simple_1: {
		name: 'simple_1',
		sample: `
return <B key="b"><A /></B>
return <div key="a">A</div>
		`,
		expected: `
return h(B, {key: 'b'}, h(A, null))
return h('div', {key: 'a'}, 'A')
`
	},

	simple_2: {
		name: 'simple_2',
		sample: `
var b = <div>test</div>

a.foo = <div></div>
		`,
		expected: `
var b = h('div', null, 'test')
a.foo = h('div', null)
		`
	},

	simple_3: {
		name: 'simple_2',
		sample: `
var b = <div>test</div>
a = <div>{[
	<div></div>
]}</div>
		`,
		expected: `
var b = h('div', null, 'test')
a = h('div', null, [
	h('div', null)
])
		`
	},
// 	complex_0: {
// 		name: 'complex_0',
// 		sample: `

// var a = (

// <div>
//   <header><h1>JSX Live Editor</h1></header>
//   <div>
//     <Compiler />
//   </div>
// 	<div></div>
// 	<Component></Component>
// </div>

// );

// 		`,
// 		expected: `

// 		`
// 	}
};
