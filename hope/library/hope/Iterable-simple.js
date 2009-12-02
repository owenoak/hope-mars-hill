/* TODO: properties for list being unique, compacted? */

/** Methods for iterating over things (don't have to be arrays). 
	This will work on any object.
	To do some funky storage, implement setItem and clearItem.

	TODO:
			- "compact" and "unique" flags
			- when applying, take methods for getItem/setItem/clearItem/removeItem
				and have everything else generic to that?
				- getItem, setItem, etc are statics so we don't have to apply (?)
				- also, notify things can be relative to that as well (eg: "addChild")
			- mixin to array
			- getItem ?
			- set(key, value) and maintain keys for hash thinger?
	@class
*/
new Mixin({
	name : "Iterable",


	defaults : {
		length : 0,
		iterable : true,
		
		//
		// mutators that we will often override per class
		//

		/** Put item into spot index, without moving anything else.
			Updates the length property.
			@param item Item to add.
			@param {Number} index Index of where to put the item.
		 */
		setItem : function(index, item, notify) {
//			if (typeof index != "number") throw this+".setItem("+item+","+index+"): index must be a number";
			this[index] = item;
			if (index + 1 > this.length) this.length = index + 1;
			if (notify != false && this.notify) this.notify("setItem", {item:item, index:index});
			return this;
		},
		
		/** Remove the item at index, wihtout moving anything else. 
			If we have removed the last item, updates list.length.
		*/
		clearItem : function(index, notify) {
			if (index >= this.length) return this;
			var item = this[index];
			delete this[index];
			if (index == this.length -1) this.length--;
			if (notify != false && this.notify) this.notify("clearItem", {item:item, index:index});
			return this;
		},


		/** Remove the item at index, removing the empty space in the list. */
		removeItem : function(index, notify) {
			if (index > this.length) return this;
			var item = this[index];
			for (var i = this.length - 1; i > index; i--) {
				this.setItem(i-1, this[i], false);
			}
			this.clearItem(this.length-1, false);
			if (notify != false && this.notify) this.notify("removeItem", {item:item, index:index});
			return this;
		},

		
		//
		// generic mutators we shouldn't need to override
		//	as all work in terms of setItem/clearItem above
		//


		/** Add an item to this list, moving things later in the list down one spot to make room.
			@param item Item to add.
			@param {Number} [index=end of list] Index of where to put the item.
		 */
		add : function add(item, index, notify) {
			if (index == null) index = this.length;
			for (var i = this.length; i > index; i--) {
				this.setItem(i, this[i-1], false);
			}
			this.setItem(index, item);
			if (notify != false && this.notify) this.notify("add", {item:item, index:index});
			return this;
		},
		
		/** Remove all occurances of item from the list, smooshing empty spaces in list.
			Updates length property.
			@param item Item to remove.
		 */
		remove : function(item, notify) {
			for (var i = this.length - 1; i >= 0; i--) {
				if (this[i] == item) this.removeItem(i, false);
			}
			if (notify != false && this.notify) this.notify("remove", {item:item});
			return this;
		},

		/** Completely empty the list. */
		clear : function(notify) {
			for (var i = this.length - 1; i >= 0; i--) {
				this.clearItem(i, false);
			}
			if (notify != false && this.notify) this.notify("clear");
			return this;
		},

		/** Set the list to another list. */
		setList : function(newList, notify) {
			this.clear(false);
			for (var i = 0, last = newList.length; i < last; i++) {
				this.setItem(i, newList[i]);
			}
			if (notify != false && this.notify) this.notify("setList", {items:newList});
			return this;
		},

		/** Replace all occurances of oldItem with newItem */		
		replace : function(oldItem, newItem, notify) {
			for (var i = 0; i < this.length; i++) {
				if (this[i] == oldItem) this.setItem(i, newItem, false);
			}			
			if (notify != false && this.notify) this.notify("setList", {items:newList});
			return this;
		},
		
		/** Add a list of things to the array at [index]. */
		addList : function(list, index, notify) {
			if (list == null || !list.length) return;
			for (var i = 0; i < list.length; i++) {
				this.add(list, index++, notify);
			}
			return this;
		},
		
		/** Add item to the end of the list. */
		append : function(item, notify) {
			this.add(item, this.length, notify);
			return this;
		},
		
		/** Add item to the front of the list */
		prepend : function(item, notify) {
			this.add(item, 0, notify);
			return this;
		},
		
		/** Remove any null items from the list. */
		compact : function(notify) {
			this.remove(null, notify);
			return this;
		},
		
		/** Splice items -- add or remove from list. 
			Same semantics as array.splice(), except it returns full list (rather than removed items).
		*/
		splice : function(index, howMany, newItem, newItem2, etc) {
			if (index == -1) index = this.length - index;

			if (howMany != null) {
				for (var i = 0; i < howMany; i++) {
					this.clearItem(index);
				}
			}
			if (arguments.length > 2) {
				for (var i = 2; i < arguments.length; i++) {
					this.add(arguments[i], index++);
				}
			}
			return this;
		},

		/** Sort this list in-place.
			Updates length property.
			@param {String} sorter Property name to sort by.
			@param {Function} sorter Function to use to sort two values (same semantics as array.sort()).
			@param {boolean} [descending=true]  If true, larger values will be sorted later.
		 */
		sort : function(sorter, descending) {
			if (typeof sorter == "string") {
				var key = sorter;
				if (descending != false) {
					sorter = function(a,b) {
						if (!a || !b) return 0;		// TODO... ?
						if (a[key] == b[key]) return 0;
						return (a[key] < b[key] ? 1 : -1);
					}
				} else {
					sorter = function(a,b) {
						if (!a || !b) return 0;		// TODO... ?
						if (a[key] == b[key]) return 0;
						return (a[key] < b[key] ? -1 : 1);
					}
				}
			}
			var array = this.toArray();
			array.sort(sorter);
			this.setList(array, false);
			return this;
		},	
		
		
		// accessors which we shouldn't need to override
		
		/** Return true if this list contains the item. */
		contains : function(item, start) {
			return this.indexOf(item, start) > -1;
		},
		
		/** Return the first index of item in the list. */
		indexOf : function(item, start) {
			if (start == null) start = 0;
			for (i = start; i < this.length; i++) {
				if (this[i] == item) return i;
			}
			return -1;
		},

		/** Return the last index of item in the list. */
		lastIndexOf : function(item, start) {
			if (start == null) start = this.length - 1;
			for (i = start; i >= 0; i--) {
				if (this[i] == item) return i;
			}
			return -1;		
		},
		
		/** Return a slice of this list. */
		slice : function(start, end) {
			if (start < 0) start = this.length - start;			
			if (end == null) end = this.length;
			var newList = new this.constructor();
			for (var i = start; i < end; i++) {
				newList.setItem(i, this[i], false); 
			}
			return newList;
		},
		
		/** Return a new list of same type with same elements as this. */
		clone : function() {
			var it = new this.constructor();
			it.setList(this, false);
			return it;
		},
		
		/** Convert this list (or a portion of it) to a vanilla Array */
		toArray : function(start, end) {
			if (start == null) start = 0;
			else if (start < 0) start = this.length - start;
			if (end == null) end = this.length;
			var array = new Array();
			for (var i = start; i < end; i++) {
				array.push(this[i]);
			}
			return array;
		},
		
		
		//
		// iterators
		//
		
		/** Execute a method for each item in the list.
			@param method Function or string name of function to invoke on each item in list.
		*/
		forEach : function(method, context) {
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
				for (var i = 0; i < this.length; i++) {
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
		select : function(selector, context) {
			if (selector == null) return this[0];
			return this.selectAll(selector, context, true);
		},
		
		/* Return new list (of same type) where selector is true.
			@param selector Function or string name of function to invoke on each item in list.
		*/
		selectAll : function(selector, context, _returnAfterOne) {
			if (selector == null) return this.clone();
			var results = (_returnAfterOne ? null : new this.constructor()),
				item, 
				result
			;
			if (typeof selector == "function") {
				for (var i = 0; i < this.length; i++) {
					item = this[i];
					if (context) {
						result = selector.call(context, item, i);
					} else {
						result = selector(item, i);
					}
					if (result) {
						if (_returnAfterOne) {
							return item;
						} else {
							results.setItem(results.length, item, false);
						}
					}
				}				
			}
			else if (typeof selector == "string") {
				var args = context;
				for (var i = 0; i < this.length; i++) {
					var item = this[i];
					if (item == null || typeof item[method] != "function") continue;
					if (args) {
						result = item[method].apply(item, args);
					} else {
						result = item[method]();
					}
					if (result) {
						if (_returnAfterOne) {
							return item;
						} else {
							results.setItem(results.length, item, false);
						}
					}
				}
			}
			else {
				throw this+"."+(_returnAfterOne ? "select" : "selectAll")
						+"(",selector,",",context,"):"
						+" selector must be function or string.";
			}
			return results;
		},
		
		/** Return a named property of each item in the list. */
		getProperty : function(key) {
			return this.forEach(function(item) {
				if (item) return item[key];
			});
		},

		/** Return true of all items in the list are truthy for method.
			Same calling semantics as forEach().
		 */
		all : function(method, context) {
			return this.selectAll(method, context).length != this.length;
		},
		
		/** Return true of at least one item in the list is truthy for method.
			Same calling semantics as forEach().
		 */
		some : function(method, context) {
			return this.selectAll(method, context, true).length > 1;
		}
	},
	
	classDefaults : {
	
	
	}
});
