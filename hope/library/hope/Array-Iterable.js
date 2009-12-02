/* Array iterators:
	- add array iterator methods to list-like things, eg: NodeList, NamedNodeMap, etc

	TODO:		- makeIterable() could (?) take a suffix to add to the methods
					so we can do  "addChild" instead of "add" ???
					- NOTE: this will require that installed methods DO NOT call other installed methods
				- check to make sure we handle arrays with empty items properly

				- 'results' arrays could return new instance of original class rather than array?

	TODO:		- require a "new":  concat, slice
						- do with .constuctor ?

				- require being able to change the length:  shift, unshift, pop, splice
						- do with "setLength" ?
*/


extend(Array, {

	// List of objects which should get the array-like methods
	//	Stick Array in there so new methods get added to that
	Iteratables : [Array],

	// Make something which has a length property and item() method iterable
	makeIterable : function makeIterable() {
		forEach(arguments, function(Class) {
			Array.Iteratables.push(Class);
			for (var name in Array.IteratorMethods) {
				if (!Class.prototype[name]) Class.prototype[name] = Array.IteratorMethods[name];
			}

			// set the Class.prototype.constructor to the Class (?)
			//	so we can create new instances in concat() etc
			Class.prototype.constructor = Class;
		});
	},

	// Add a method to the list of iterator methods
	//	(and assign it to all Iteratables)
	addIterator : function addIterator(name, method) {
		Array.IteratorMethods[name] = method;
		Array.Iteratables.forEach(function(Class) {
			if (!Class.prototype[name]) Class.prototype[name] = method;
		});
	},

	addIterators : function addIterators(map) {
		for (var key in map) {
			Array.addIterator(key, map[key]);
		}
	},

	// List of Array.prototype iteration/etc methods to add to other array-like things
	IteratorMethods : {

		iterable : true,			// flag that shows we can be iterated over

		extend : extendPrototype,
		extendClass : extendThis,

		// convert to a vanilla Array
		toArray : Array.prototype.clone,

		// return the index of what in this list
		indexOf : function indexOf(it, index) {
			if (!index) index = 0;
			if (index < 0) index = this.length - index;
			for (var len = this.length; index < len; index++) {
				if (it == this[index]) return index;
			}
			return -1;
		},

		// return index of last occurance of it in the list
		lastIndexOf : function lastIndexOf(it, index) {
			if (!index) index = this.length;
			if (index < 0) index = this.length - index;
			for (; index >= -1; index--) {
				if (it == this[index]) return index;
			}
			return -1;
		},

		// call a method for each item()  (no return value)
		forEach : function forEach(method, context) {
			for (var index = 0, len = this.length; index < len; index++) {
				var it = this[index];
				method.call(context, it, index, this);
			}
		},

		// return the results of method call for each item()
		map : function map(method, context) {
			var results = [];
			for (var index = 0, len = this.length; index < len; index++) {
				var it = this[index];
				results[index] = method.call(context, it, index, this);
			}
			return results;
		},

		// return only item()s for which method call returns a true-ish value
		// TODO: rename "selectAll"
		filter : function filter(method, context) {
			var results = new this.constructor();
			for (var index = 0, len = this.length; index < len; index++) {
				var it = this[index];
				if (method.call(context, it, index, this)) results.push(it);
			}
			return results;
		},

		// return true if method call for ALL item()s returns true-ish value
		//  if you don't pass any arguments, returns true iff all list items are truthy
		//
		// NOTE: if array is of 0-length, returns false ????
		all : function every(method, context) {
			if (this.length == 0) return false;
			
			if (arguments.length == 0) {
				for (var index = 0, len = this.length; index < len; index++) {
					if (!this[index]) return false;
				}
			} else {
				for (var index = 0, len = this.length; index < len; index++) {
					var it = this[index];
					if (!method.call(context, it, index, this)) return false;
				}
			}
			return true;
		},

		// return true if method call for AT LEAST ONE item() returns true-ish value
		some : function some(method, context) {
			if (arguments.length == 0) {
				for (var index = 0, len = this.length; index < len; index++) {
					if (this[index]) return true;
				}
			} else {
				for (var index = 0, len = this.length; index < len; index++) {
					var it = this[index];
					if (method.call(context, it, index, this)) return true;
				}
			}
			return false;
		},

		// add a bunch of numbers together
		// NOTE: does a parseFloat() on each item and only adds if a number
		sum : function sum() {
			var sum = 0;
			for (var index = 0, len = this.length; index < len; index++) {
				var number = parseFloat(this[index]);
				if (!isNaN(number)) sum += number;
			}
			return sum;
		},

		//
		//	the following routines only work if the list can be mutated
		//

		// add one or more elements to this list
		push : function push() {
			for (var i = 0, len = arguments.length; i < len; i++) {
				this.add(arguments[i]);
			}
		},

		// reverse the array in place
		reverse : function reverse() {
			var list = this.toArray();
			for (var length = this.length, index = length - 1; index > -1; index--) {
				this[length-index] = list[index];
			}
			return this;
		}
	}

});


Array.makeIterable(Array);

//
//	additional methods available on all Iteratables
//

Array.addIterators({
	where : Array.IteratorMethods.filter,

	// return a new array with each item in it only once
	unique : function() {
		var results = new this.constructor;
		for (var index = 0, len = this.length; index < len; index++) {
			var it = this[index];
			if (!results.contains(it)) results[results.length] = it;
		}
		return results;
	},

	// return a property for each item in the list
	getProperty : function(propertyName) {
		var results = [];
		for (var index = 0, len = this.length; index < len; index++) {
			var it = this[index];
			if (it) results[index] = it[propertyName];
		}
		return results;
	},

	// invoke a method (or named method) on all items in the list
	//	if item does NOT support that method, skips the call
	invoke : function invoke(method, args) {
		var results = [];
		if (typeof method == "function") {
			for (var index = 0, len = this.length; index < len; index++) {
				var it = this[index];
				if (it == null) continue;
				results[index] = method.apply(it, args);
			}
		} else {
			for (var index = 0, len = this.length; index < len; index++) {
				var it = this[index];
				if (it == null || !it[method]) continue;
				results[index] = it[method].apply(it, args);
			}
		}
		return results;
	},

	// return true if it is found in this list
	// if index is passed, starts at that index (same semantics as iterable.indexOf)
	contains : function contains(it, index) {
		return this.indexOf(it, index) > -1;
	},

	// return first element which matches a particular criteria (eg: results of callback is not null, false, "" or undefined)
	// TODO: rename "select"
	first : function first(callback, context) {
		for (var index = 0, len = this.length; index < len; index++) {
			var it = this[index];
			if (method.call(context, it, index, this)) return it;
		}
	},


	// set this list to the same as an otherList (including length)
	// TODO: name?
	setTo : function(otherList) {
		if (otherList == null) return this;
		for (var index = 0, len = otherList.length; index < len; index++) {
			this[index] = otherList[index];
		}
		this.length = len;
		return this;
	},

	// add it to this list
	//	if index is specified, puts in that place and pushes later things forward
	//	if index is not specified or is beyond length of array, just adds to end
	add : function(it, index) {
		if (typeof index != "number") index = this.length;
		this.splice(index, 0, it);
		return this;
	},
	

	// remove all occurances of it from this list
	// NOTE: only works if the list can be mutated
	remove : function(it) {
		var notIt = [];
		for (var index = 0, len = this.length; index < len; index++) {
			var item = this[index];
			if (item != it) notIt[notIt.length] = item;
		}
		this.setTo(notIt);
		return this;
	},

	// replace all occurances of oldItem with newItem
	replace : function(oldItem, newItme) {
		for (var index = 0, len = this.length; index < len; index++) {
			if (this[index] == oldItem) this[index] = newItem;
		}
		return this;
	}
});
