var a = 0;
var total = 1 + a;

var template = (
	<div class="oh" checked>
		<p class={name}>hello world</p>
		<Component></Component>
		Hello World {this.state}
		// we want {this.state} to get registerd as a new text node
		<input />

		// this comment line will get skipped, newlines also don't register

		/**
		 * so will this comment block
		 */
		
		<!-- and this html comment -->
	</div>
);

// outside of the jsx context everything is back to normal

/**
 * this comment block will show
 */

<!-- and this html comment -->

return (
	<p class={name}>hello world</p>
);