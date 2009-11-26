
// define forEach and map in the global scope for convenience
//	(eg: when dealing with method arguments, etc)
window.forEach = Array.forEach;
window.map = Array.map;

// add standard iterator methods to Array.prtotype
extend(Array.prototype, {
	// give Arrays an "item" function (for conistency in Iteratables)
	item : function item(index) {
		return this[index];
		},

	setItem : function(index, it) {
		this[index] = it;
	},

	// give Arrays a "clone" function (for consistency in iteratables)
	clone : function clone() {
		for (var array = [], index = 0, len = this.length; index < len; index++) {
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
	// convert a single array-like thing to an array
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
		var output = [];
		for (var i = 0, len = arguments.length; i < len; i++) {
			if (arguments[i] && arguments[i].length) Array.toArray(arguments[i], output);
		}
		return output;
	},

	// splice list RETURNING REMAINING LIST (unlike Array.splice which returns stuff that was removed)
	// use this to convert an Arguments array
	splice : function(list, index, howMany, element1, element2, etc) {
		list = Array.toArray(list);

		// short cut for common case
		if (arguments.length == 3) {
			list.splice(index, howMany);
		
		} else if (arguments.length > 1) {
			var args = Array.toArray(arguments);
			args.splice(0, 1);
			list.splice.apply(list, args);
		}
		return list;
	},
	
	// given an array of function arguments, return a proper Array
	//	if startAt is a number, we will skip elements before startAt
	args : function(functionArguments, startAt) {
		var array = [];
		for (var i = startAt || 0, len = functionArguments.length; i < len; i++) {
			array[array.length] = arguments[i];
		}
		return array;
	}

});
