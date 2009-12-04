(function(){	

	// add extension methods to Array
	Array.extend = extendPrototype;
	Array.extendClass = extendThis;
	Array.prototype.extend = extendThis;

	// add ListLike methods to Array
	ListLike.mixinTo(Array, {override:false});
	
	// make arrays observable
	Observable.mixinTo(Array);
	
	// add instance utility methods to Array
	Array.extend({
		// override array.prototype.forEach and .sort with our versions
		//	which is backwards-compatible but add additional goodies
		forEach : ListLike.defaults.forEach,
		sort : ListLike.defaults.sort
	});


	// add static utility methods to Array
	Array.extendClass({
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

})();
