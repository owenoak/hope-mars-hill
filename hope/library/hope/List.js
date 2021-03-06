/** 
	Methods for iterating over a list of things. 
	This will work on any object, by managing the 'length' property.
	Note that you should NOT assign to the list directly, but rather use add(), remove(), etc
	 so that the length property is maintained and all notifications are properly sent.
	

	TODO:
			- mixin to array
			- set(key, value) and maintain keys for hash thinger?
	@class
*/
new Class({
	name : "List",

	// initialize the class
	initialize : function() {
		// save the original Array.prototype.sort routine so we can call it later
		//	(necessary because we're going to override sort below)
		List.originalArraySort = Array.prototype.sort;
	},

	defaults : {
		length : 0,

		compact : new SmartSetter({
			value : false,
			set : function(newValue) {
				if (newValue) {
					var compacted = this.selectAll(function(it, index){
						return it != null
					});
					this.setTo(compacted);
				}
				return newValue;
			}
		}),
		
	
		unique : new SmartSetter({
			value : false,
			set : function(newValue) {
				if (newValue) {
					var unique = new this.constructor();
					this.forEach(function(it) {
						if (!unique.contains(it)) unique.add(it);
					});
					this.setTo(unique);
				}
				return newValue;
			}
		}),

		initialize : function(properties, items) {
			if (properties) this.extend(properties);
			if (items) this.setTo(items);
		},

		/** Set item in the list by index */
		setItem : function(index, item, notify) {
			this[index] = item;
			if (index + 1 > this.length) this.length = index + 1;
			if (notify != false) this.notify("set"+this.topic, {item:item, index:index});
			return this;
		},

		/* Set this list to another list. */
		setTo : function(list, notify) {
			this.clear(null, notify);
			this.addList(list, notify);
			return this;
		},


		/** If you specify an index, removes that item. 
			If index == null, clears the entire list.
		*/
		clear : function clear(index, notify, force) {
			if (index == undefined) {
				if (this.length == 0) return;
				for (var i = this.length; i >= 0; i--) {
					this.clear(i, notify, true);
				}
			} else {
				var length = this.length;
				if (index >= length) return this;
				
				var item = this[index];
				// if we're dealing with a compact list and we're not clearing the last item
				//	remove the item instead
				if (force != true && this.compact && index != length -1) {
					return this.removeItem(index, notify);
				}
				delete list[index];
				if (index == length - 1) this.length = Math.max(0, index);
				if (notify != false) this.notify("clear"+this.topic, {item:item, index:index});
			}
			return this;
		},
		
		/** Add an item to this list, moving things later in the list down one spot to make room.
			@param item itemName to add.
			@param {Number} [index=end of list] Index of where to put the item.
		 */
		add : function add(item, index, notify) {
			if (this.compact && item == null) return this;
			if (this.unique) this.remove(item, false, false);

			if (index == null) 	index = this.length;

			for (var i = this.length; i > index; i--) {
				this.setItem(i, this[i-1]);
			}
			this.setItem(index, item);
			if (notify != false) this.notify("add"+this.topic, {item:item, index:index});
			return this;
		},
		
		/** Add a list of things to the array at [index]. */
		addList : function addList(list, index, notify) {
			if (list == null || !list.length) return;
			for (var i = 0, length = list.length; i < length; i++) {
				var next = list[i];
				this.add(next, index, notify);
				if (index != null && this[index] == next) index++;
			}
			return this;
		},
	

		/** Remove all occurances of item from the list, smooshing empty spaces in list.
			Updates length property.
			@param {number or function or any} item
					If number, index of item to remove.
					If function, function to call, removing if function is truthy.
					Otherwise item to remove.
			@param {Boolean} [inPlace] If true (and 'compact' is false) we keep everything in place.
		 */
		remove : function remove(item, notify) {
			if (this.length == 0) return this;
			var indexes = [];
			for (var i = this.length - 1; i >= 0; i--) {
				if (this[i] != item) continue;
				this.removeItem(i, false);
				// remember the index where we found it
				indexes.push(i);
			}
			if (indexes.length > 0) {
				if (notify != false) this.notify("remove"+this.topic, {item:item, indexes:indexes});
			}
			return this;
		},

		/* Remove a single item from the list by index. */
		removeItem : function removeItem(index, notify) {
			if (typeof index != "number" || index > this.length) return this;
			var item = this[index];
			// actually remove it and push the end backwards
			for (var i = index; i < this.length; i++) {
				this.setItem(i, this[i+1], false);
			}
			this.clear(this.length-1, false, true);
			if (notify != false) this.notify("remove"+this.topic, {item:item, indexes:[index]});
			return this;
		},


		/** Remove a set of things from the list. 
			@param [list] List of items to remove.
					If undefined, we will remove everything from the list.
		*/
		removeList : function removeList(list, notify) {
			if (list == null) return this;
			for (var i = 0, last = list.length; i < last; i++) {
				this.remove(list[i], notify);
			}
			return this;
		},
		
		/** Replace all occurances of oldItem with newItem */
		replace : function replace(oldItem, newItem, notify) {
			var indexes = [];
			for (var i = 0, length = this.length; i < length; i++) {
				if (this[i] != oldItem) continue;
				this.removeItem(i, notify);
				this.add(newItem, i, notify);
				indexes.push(i);
			}
			if (indexes.length) {
				if (notify != false) 
					this.notify("replace"+this.topic, {indexes:indexes, item:newItem, oldItem:oldItem});
			}
			return this;
		},
		
		/** Add item to the end of the list. */
		append : function append(item, notify) {
			this.add(item, this.length, notify);
			return this;
		},

		/** Add item to the front of the list */
		prepend : function prepend(item, notify) {
			this.add(item, 0, notify);
			return this;
		},

		/** Return true if this list contains the item. */
		contains : function contains(item, start) {
			return this.indexOf(item, start) > -1;
		},

		/** Return the first index of item in the list. */
		indexOf : function indexOf(item, start) {
			if (this.length == 0) return -1;
			if (start == null) start = 0;
			for (i = start, length = this.length; i < length; i++) {
				if (this[i] == item) return i;
			}
			return -1;
		},

		/** Return the last index of item in the list. */
		lastIndexOf : function lastIndexOf(item, start) {
			if (this.length == 0) return -1;
			if (start == null) start = this.length - 1;
			for (i = start; i >= 0; i--) {
				if (this[i] == item) return i;
			}
			return -1;		
		},
	
		/** Splice items -- add or remove from list. 
			Same semantics as array.splice(), except it returns full list (rather than removed items).
		*/
		splice : function splice(index, howMany, newItem, newItem2, etc) {
			if (index == -1) index = this.length - index;
			var results = new this.constructor();
			if (typeof howMany == "number") {
				for (var i = 0; i < howMany; i++) {
					results.append(this.removeItem(index));
				}
			}
			if (arguments.length > 2) {
				for (var i = 2; i < arguments.length; i++) {
					this.add(arguments[i], index++);
				}
			}
			return results;
		},


		/** Sort this list in-place.
			Updates length property.
			@param {String} sorter Property name to sort by.
			@param {Function} sorter Function to use to sort two values (same semantics as array.sort()).
			@param {boolean} [descending=true]  If true, larger values will be sorted later.
		 */
		sort : function sort(sorter, descending, notify) {
			if (typeof sorter == "string") {
				var key = sorter;
				if (descending != true) {
					sorter = function(a,b) {
						if (!a || !b) return 0;		// TODO... ?
						if (a[key] == b[key]) return 0;
						return (a[key] > b[key] ? 1 : -1);
					}
				} else {
					sorter = function(a,b) {
						if (!a || !b) return 0;		// TODO... ?
						if (a[key] == b[key]) return 0;
						return (a[key] > b[key] ? -1 : 1);
					}
				}
			} else if (!sorter && descending != undefined) {
				if (descending != true) {
					sorter = function(a,b) {
						if (!a || !b) return 0;		// TODO... ?
						if (a == b) return 0;
						return (a > b ? 1 : -1);
					}
				} else {
					sorter = function(a,b) {
						if (!a || !b) return 0;		// TODO... ?
						if (a == b) return 0;
						return (a > b ? -1 : 1);
					}
				}
			}
			
			// use the original array sort which we stored on List.initialize() to do the actual sorting
			if (sorter) {
				List.originalArraySort.call(this, sorter);
			} else {
				List.originalArraySort.call(this);
			}
			if (notify != false) this.notify("sort"+this.topic, {list:this});
			return this;
		},
	
		
		/** Return a slice of this list. */
		slice : function slice(start, end) {
			var results = new this.constructor();
			if (start == null) 		start = 0;
			else if (start < 0) 	start = this.length - start;
			
			if (end == null) 		end = this.length;
			if (end > this.length)  end = this.length;
			for (var i = start; i < end; i++) {
				results.append(this[i]);
			}
			return results;
		},

		
		/** Return a new list of same type with same elements as this. */
		clone : function clone() {
			var clone = new this.constructor();
			if (!this.length) return clone;
			clone.setTo(this);
			return clone;
		},
		
		
		//
		// iterators
		//
		
		/** Execute a method for each item in the list.
			@param method Function or string name of function to invoke on each item in list.
		*/
		forEach : function forEach(method, context) {
			var results = [];
			
			if (typeof method == "function") {
				// short cut if context is not defined -- quite a bit more efficient
				if (arguments.length == 1) {
					for (var i = 0; i < this.length; i++) {
						results[i] = method(this[i], i);
					}				
				} else {
					var args = Array.args(arguments);
					for (var i = 0; i < this.length; i++) {
						args[0] = this[i];
						args[1] = i;
						results[i] = method.apply(context, args);
					}				
				}
			}
			else if (typeof method == "string") {
				var args = context;
				for (var i = 0, length = this.length; i < length; i++) {
					var item = this[i];
					if (item == null || typeof item[method] != "function") continue;
					if (args) {
						results[i] = item[method].apply(item, args);
					} else {
						results[i] = item[method]();
					}
				}
			}
			else {
				throw this+".forEach("+method+","+context+"): method must be function or string.";
			}

			results.length = this.length;
			return results;
		},

		
		/* Return first item for which selector is true. 
			@param selector Function or string name of function to invoke on each item in list.
		*/
		select : function select(selector, context) {
			if (!this.length) return null;
			if (selector == null) return this[0];
			return this.selectAll(selector, context, true);
		},

		
		/* Return new list (of same type) where selector is true.
			@param selector Function or string name of function to invoke on each item in list.
		*/
		selectAll : function selectAll(selector, context, _returnFirst) {
			if (selector == null) return this.clone();
			var results = (_returnFirst ? null : new this.constructor()),
				item, 
				result
			;
			if (typeof selector == "function") {
				for (var i = 0, length = this.length; i < length; i++) {
					item = this[i];
					if (context) {
						result = selector.call(context, item, i);
					} else {
						result = selector(item, i);
					}
					if (result) {
						if (_returnFirst) {
							return item;
						} else {
							results.setItem(results.length, item);
						}
					}
				}				
			}
			else if (typeof selector == "string") {
				var args = context;
				for (var i = 0, length = this.length; i < length; i++) {
					var item = this[i];
					if (item == null || typeof item[selector] != "function") continue;
					if (args) {
						result = item[selector].apply(item, args);
					} else {
						result = item[selector]();
					}
					if (result) {
						if (_returnFirst) {
							return item;
						} else {
							results.setItem(results.length, item);
						}
					}
				}
			}
			else {
				throw this+"."+(_returnFirst ? "select" : "selectAll")
						+"(",selector,",",context,"):"
						+" selector must be function or method name string.";
			}
			
			// if not found, return null
			if (_returnFirst) 	return null;
			else				return results;
		},

		/** convert the list to a string, separated by separator. */
		print : function(separator) {
			if (this.length == 0) return "";
			if (separator == null) separator = "";
			var output = "";
			for (var i = 0, len = this.length - 1; i < len; i++) {
				output += this[i] + separator;
			}
			output += this[i];
			return output;
		},
		
		
		/** Return a named property of each item in the list. */
		getProperty : function getProperty(key) {
			if (!this) return [];
			return this.forEach(function(item) {
				if (item) return item[key];
			});
		},


		/** Return true of all items in the list are truthy for method.
			Same calling semantics as forEach().
		 */
		all : function all(method, context) {
			if (!this) return false;
			var results = this.selectAll(method, context);
			return (results.length == this.length);
		},

		
		/** Return true of at least one item in the list is truthy for method.
			Same calling semantics as forEach().
		 */
		some : function some(method, context) {
			if (!this) return false;
			var results = this.select(method, context);
			return (results != null)
		},
		
		
		/** Return true if this list equals another list. */
		equals : function equals(list) {
			if (arguments.length > 1) list = arguments;
			if (!list) return (this.length == 0);
			if (this.length != list.length) return false;
			for (var i = 0; i < this.length; i++) {
				if (this[i] != list[i]) return false;	
			}
			return true;
		},
		
		
		
		//
		//	debug
		//
		debug : function() {
			console.debug(this.print(","));
		}
	},
	
	classDefaults : {
		mixinTo : function mixinTo(constructor, options) {
			// extend without overriding
			extend(constructor.prototype, this.defaults, false);
			constructor.prototype.asList = this.prototype.asList;
			constructor.asList = this.asList;
		}
	}
});

// set List up as a mixin
Mixins.add("List", List);
