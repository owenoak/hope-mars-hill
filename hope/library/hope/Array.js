
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
			if (arguments[i]) Array.toArray(arguments[i], output);
		}
		return output;
	}

});