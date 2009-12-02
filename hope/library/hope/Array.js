(function(){	
	/** Combine a number of array-like things into a single vanilla array.
		Use this to merge arguments together, etc.
	*/
	window.combine = function combine() {
		var list = [];
		for (var i = 0, len = arguments.length; i < len; i++) {
			if (arguments[i] && arguments[i].length) Array.toArray(arguments[i], list);
		}
		return list;
	}
	
	// add standard iterator methods to Array.prtotype
	extend(Array.prototype, {
		// give Arrays a "clone" function (for consistency in iteratables)
		clone : function clone() {
			for (var array = new this.constructor(), index = 0, len = this.length; index < len; index++) {
				array[index] = this.item(index);
			}
			return array;
		},
		
		remove : function(it) {
			var index;
			while ( (index == this.indexOf(it)) != -1 ) {
				this.splice(index, 1);
			}
			return this;
		}
	});
	
	
	extend(Array, {
		// Convert a single array-like thing to an array
		// if you pass in an 'array', will add to that (and return that)
		//	otherwise will create a new array
		toArray : function(it, array) {
			if (!array) array = [];
			if (!it) return array;
			for (var i = 0; i < it.length; i++) {
				array[array.length] = it[i];
			}
			return array;
		},
	
		// take a series of array-like things and combine them into a single array
		// NOTE: each element MUST be an actual array or method arguments, etc
		//		 DO NOT call this with a string or function, etc or you will get wierd results!
		combine : function combine() {
			var output = new this.constructor();
			for (var i = 0, len = arguments.length; i < len; i++) {
				if (arguments[i] && arguments[i].length) Array.toArray(arguments[i], output);
			}
			return output;
		},
	
		// given an array of function arguments, return a proper Array
		//	if startAt is a number, we will skip elements before startAt
		args : function(functionArguments, startAt) {
			var array = [];
			for (var i = startAt || 0, len = functionArguments.length; i < len; i++) {
				array[array.length] = functionArguments[i];
			}
			return array;
		}
	
	});
	
	
	
	
	
	/** Alias `Array.forEach()` to `window.ForEach()` (in the global name space) for convenience. */
	window.forEach = Array.forEach;
	
	/** Alias `Array.map()` to `window.map()` (in the global name space) for convenience. */
	window.map = Array.map;

})();
