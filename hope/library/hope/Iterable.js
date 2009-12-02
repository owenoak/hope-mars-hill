/** Methods for iterating over things (don't have to be arrays). 
	This will work on any object.
	To do some funky storage, implement setItem and clearItem.

	TODO:
			- "compact" and "unique" flags
			- mixin to array
			- set(key, value) and maintain keys for hash thinger?
	@class
*/
new Mixin({
	name : "Iterable",

	itemName : "",

	getDefaults : function(constructor, options) {
		if (!options) options = {};
		var Item = options.itemName || options.ItemName || this.itemName,
			unique = (typeof options.unique == "boolean" ? options.unique : false),
			compact = (typeof options.compact == "boolean" ? options.compact : false),
			getList = options.getList || function(list){ return list }
		;

		//
		//	utility functions for the methods we install
		//
		
		/* Swap same elements in list around (eg: after sort). */
		function setList(list, newList) {
			for (var i = 0, last = getLength(newList); i < last; i++) {
				setItem(list, i, newList[i]);
			}
			list.length = newList.length;
			return list;
		}
		
		/** Set item in the list */
		function setItem(list, index, item) {
			list[index] = item;
			if (index + 1 > list.length) list.length = index + 1;
		}

		/** Clear the item at index, leaving the rest of the list alone.
		   Will update length if removed last item from the list. */
		function clearItem(list, index) {
			if (index >= list.length) return;
			delete list[index];
			if (index == length -1) index.length--;
		}
		
		/** Remove the item at index, removing the empty space in the list. */
		function removeItem(list, index, inPlace) {
			if (compact != true && inPlace == true) {
				return clearItem(list, index);
			}
			
			for (var i = list.length - 1; i > index; i--) {
				setItem(list, i-1, list[i]);
			}
			list.length--;
		}
		

		var methods = {
			length : 0,
			iterable : true,
			
			/** Add an item to this list, moving things later in the list down one spot to make room.
				@param item Item to add.
				@param {Number} [index=end of list] Index of where to put the item.
				@param {Boolean} [inPlace=false] If true, we leave everything else in place.
												 If false or null, we scootch everything over one.
			 */
			add : function add(item, index, inPlace, notify) {
				if (compact && item == null) return;
				if (unique) this.remove(item, null, false);

				var list = getList(this);
				if (index == null) index = list.length;
				if (inPlace != true) {
					for (var i = list.length; i > index; i--) {
						setItem(list, i, list[i-1]);
					}
				}
				setItem(list, index, item);
				if (notify != false && this.notify) this.notify("add"+Item, {item:item, index:index});
				return this;
			},
			
			/** Add a list of things to the array at [index]. */
			addAll : function addAll(listToAdd, index, notify) {
				if (listToAdd == null || !listToAdd.length) return;
				for (var i = 0; i < listToAdd.length; i++) {
					this.add(listToAdd[i], index++, notify);
				}
				return this;
			},
			
			/** Remove all occurances of item from the list, smooshing empty spaces in list.
				Updates length property.
				@param [item] Item to remove.
				@param {Number} [index] Index of item to remove.
				@param {Boolean} [inPlace] If true (and 'compact' is false) we keep everything in place.
			 */
			remove : function remove(item, index, inPlace, notify) {
				var list = getList(this);
				if (typeof index == "number" && index < this.length - 1) {
					removeItem(list, index, inPlace);
				} else {
					for (var i = list.length - 1; i >= 0; i--) {
						if (list[i] != item) continue;
						removeItem(list, i, inPlace);
					}
				}
				if (notify != false && this.notify) this.notify("remove"+Item, {item:item});
				return this;
			},

			/** Remove a set of things from the list. 
				@param [listToRemove=this list] List of items to remove.
						If undefined, we will remove everything from the list.
			*/
			removeAll : function removeAll(listToRemove, inPlace, notify) {
				if (listToRemove == null) listToRemove = Array.toArray(getList(this));
				for (var i = 0; i < listToRemove.length; i++) {
					this.remove(listToRemove[i], null, inPlace, notify);
				}
				return this;
			},

	
			/** Replace all occurances of oldItem with newItem */		
			replace : function replace(oldItem, newItem, notify) {
				var list = getList(this);
				for (var i = 0, length = list.length; i < length; i++) {
					if (list[i] != oldItem) continue;
					this.remove(null, i, true, notify);
					this.add(newItem, i, true, notify);
				}			
				if (notify != false && this.notify) this.notify("replace"+Item, {oldItem : oldItem, newItem:newItem});
				return this;
			},
			
			/** Add item to the end of the list. */
			append : function append(item, notify) {
				var list = getList(this);
				list.add(item, list.length, notify);
				return this;
			},
			
			/** Add item to the front of the list */
			prepend : function prepend(item, notify) {
				var list = getList(this);
				list.add(item, 0, notify);
				return this;
			},
			
			/** Remove any null items from the list. */
			compact : function compact(notify) {
				var list = getList(this);
				list.remove(null, null, notify);
				return this;
			},
			
			/** Splice items -- add or remove from list. 
				Same semantics as array.splice(), except it returns full list (rather than removed items).
			*/
			splice : function splice(index, howMany, newItem, newItem2, etc) {
				var list = getList(this);
				if (index == -1) index = list.length - index;
	
				if (howMany != null) {
					for (var i = 0; i < howMany; i++) {
						clearItem(list, index);
					}
				}
				if (arguments.length > 2) {
					for (var i = 2; i < arguments.length; i++) {
						list.add(arguments[i], index++);
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
			sort : function sort(sorter, descending) {
				var list = getList(this);
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
				var array = Array.toArray(list);
				array.sort(sorter);
				setList(list, array, false);
				return this;
			},	
			
			
			// accessors which we shouldn't need to override
			
			/** Return true if this list contains the item. */
			contains : function contains(item, start) {
				var list = getList(this);
				return list.indexOf(item, start) > -1;
			},
			
			/** Return the first index of item in the list. */
			indexOf : function indexOf(item, start) {
				var list = getList(this);
				if (start == null) start = 0;
				for (i = start, length = list.length; i < length; i++) {
					if (list[i] == item) return i;
				}
				return -1;
			},
	
			/** Return the last index of item in the list. */
			lastIndexOf : function lastIndexOf(item, start) {
				var list = getList(this);
				if (start == null) start = list.length - 1;
				for (i = start; i >= 0; i--) {
					if (list[i] == item) return i;
				}
				return -1;		
			},
			
			/** Return a slice of this list. */
			slice : function slice(start, end) {
				var list = getList(this);
				if (start < 0) start = list.length - start;			
				if (end == null) end = list.length;
				var newList = new list.constructor();
				for (var i = start; i < end; i++) {
					setItem(newList, i, list[i]); 
				}
				return newList;
			},
			
			/** Return a new list of same type with same elements as this. */
			clone : function clone() {
				var list = getList(this);
				var it = new list.constructor();
				setList(it, list);
				return it;
			},
			
			
			//
			// iterators
			//
			
			/** Execute a method for each item in the list.
				@param method Function or string name of function to invoke on each item in list.
			*/
			forEach : function forEach(method, context) {
				var list = getList(this);
				var results = [];
				
				if (typeof method == "function") {
					// short cut if context is not defined -- quite a bit more efficient
					if (arguments.length == 1) {
						for (var i = 0; i < list.length; i++) {
							results[i] = method(list[i], i);
						}				
					} else {
						var args = Array.args(arguments);
						for (var i = 0; i < list.length; i++) {
							args[0] = list[i];
							args[1] = i;
							results[i] = method.apply(context, args);
						}				
					}
				}
				else if (typeof method == "string") {
					var args = context;
					for (var i = 0, length = list.length; i < length; i++) {
						var item = list[i];
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
	
				results.length = list.length;
				return results;
			},
			
			/* Return first item for which selector is true. 
				@param selector Function or string name of function to invoke on each item in list.
			*/
			select : function select(selector, context) {
				var list = getList(this);
				if (selector == null) return list[0];
				return list.selectAll(selector, context, true);
			},
			
			/* Return new list (of same type) where selector is true.
				@param selector Function or string name of function to invoke on each item in list.
			*/
			selectAll : function selectAll(selector, context, _returnFirst) {
				var list = getList(this);
				if (selector == null) return list.clone();
				var results = (_returnFirst ? null : new list.constructor()),
					item, 
					result
				;
				if (typeof selector == "function") {
					for (var i = 0, length = list.length; i < length; i++) {
						item = list[i];
						if (context) {
							result = selector.call(context, item, i);
						} else {
							result = selector(item, i);
						}
						if (result) {
							if (_returnFirst) {
								return item;
							} else {
								setItem(results, results.length, item);
							}
						}
					}				
				}
				else if (typeof selector == "string") {
					var args = context;
					for (var i = 0, length = list.length; i < length; i++) {
						var item = list[i];
						if (item == null || typeof item[method] != "function") continue;
						if (args) {
							result = item[method].apply(item, args);
						} else {
							result = item[method]();
						}
						if (result) {
							if (_returnFirst) {
								return item;
							} else {
								setItem(results, results.length, item);
							}
						}
					}
				}
				else {
					throw this+"."+(_returnFirst ? "select" : "selectAll")
							+"(",selector,",",context,"):"
							+" selector must be function or string.";
				}
				return results;
			},
			
			/** Return a named property of each item in the list. */
			getProperty : function getProperty(key) {
				var list = getList(this);
				return list.forEach(function(item) {
					if (item) return item[key];
				});
			},
	
			/** Return true of all items in the list are truthy for method.
				Same calling semantics as forEach().
			 */
			all : function all(method, context) {
				var list = getList(this);
				return list.selectAll(method, context).length != list.length;
			},
			
			/** Return true of at least one item in the list is truthy for method.
				Same calling semantics as forEach().
			 */
			some : function some(method, context) {
				var list = getList(this);
				return list.selectAll(method, context, true).length > 0;
			}
		};
		return methods;
	}
});
