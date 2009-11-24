/*
	hope object
		added to in lots of other files

*/

window.hope = {

	// walk the properties of the context according to the path passed in
	//		eg:   hope.walk( {a: { b: { c : 1} } }, "a.b.c") ==> 1
	//
	//	returns undefined if any step along the way is not defined
	//
	//	steps can either be:
	//		- "xxx()" 	in which case <newContext = context.xxx()>
	//					(NOTE: no arguments allowed!)
	//		- "xxx"  	in which case   <newContext = context.xxx>
	//
	get : function(path, context, skipLevels) {
			if (!path) return undefined;
			if (!context) context = window;

			if (typeof path == "number") return context[path];

			// split the path by dots
			path = path.split(".");

			// figure out where we should stop
			var last = path.length - (skipLevels || 0);

			// if back too far, return undefined
			if (last < 0) return undefined;

			// for each step in the path
			for (var i = 0; i < last; i++) {
				var step = path[i];
				if (step.endsWith("()")) {
					context = context[step.substr(0,step.length-2)]();
				} else {
					context = context[step];
				}
				if (context == null) return;
			}
			return context

	}

}
