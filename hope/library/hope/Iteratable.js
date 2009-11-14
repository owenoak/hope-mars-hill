/* Array iterators:  
	- add array iterator methods to list-like things, eg: NodeList, NamedNodeMap, etc 

	TODO:		- makeIteratable() could (?) take a suffix to add to the methods
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
	//	Stick Array.prototype in there so new methods get added to that
	Iteratables : [Array],

	// Make something which has a length property and item() method iteratable
	makeIteratable : function makeIteratable() {
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
		
		iteratable : true,			// flag that shows we can be iterated over
		
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
		filter : function filter(method, context) {
			var results = [];
			for (var index = 0, len = this.length; index < len; index++) {
				var it = this[index];
				if (method.call(context, it, index, this)) results.push(it);
			}
			return results;
		},
		
		// return true if method call for ALL item()s returns true-ish value
		every : function every(method, context) {
			for (var index = 0, len = this.length; index < len; index++) {
				var it = this[index];
				if (!method.call(context, it, index, this)) return false;
			}
			return true;
		},
		
		// return true if method call for AT LEAST ONE item() returns true-ish value
		some : function some(method, context) {
			for (var index = 0, len = this.length; index < len; index++) {
				var it = this[index];
				if (method.call(context, it, index, this)) return true;
			}
			return false;
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


Array.makeIteratable(Array);

//
//	additional methods available on all Iteratables
//

Array.addIterators({
	where : Array.IteratorMethods.filter,
	
	// return a new array with each item in it only once
	unique : function() {
		var results = [];
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

	// invoke a named method on all items in the list
	//	if item does NOT support that method, skips the call
	invoke : function invoke(methodName, args) {
		var results = [];
		for (var index = 0, len = this.length; index < len; index++) {
			var it = this[index];
			if (!it || !it[methodName]) continue;			
			results[index] = it[methodName].apply(it, args);
		}
		return results;
	},

	// return true if it is found in this list
	// if index is passed, starts at that index (same semantics as iteratable.indexOf)
	contains : function contains(it, index) {
		return this.indexOf(it, index) > -1;
	},

	// return first element which matches a particular criteria (eg: results of callback is not null, false, "" or undefined)
	first : function first(callback, context) {
		for (var index = 0, len = this.length; index < len; index++) {
			var it = this[index];
			if (method.call(context, it, index, this)) return it;
		}
	},


	// set this list to the same as an otherList (including length)
	// TODO: name?
	setTo : function(otherList) {
		for (var index = 0, len = otherList.length; index < len; index++) {
			this[index] = otherList[index];
		}
		this.length = len;
		return this;
	},

	// add one or more things to this array
	add : function() {
		for (var index = 0, len = argments.length; index < len; index++) {
			this[this.length] = arguments[index];
		}
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
		return false;
	}
});
