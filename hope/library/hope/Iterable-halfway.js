/* TODO: properties for list being unique, compacted? */

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

	Item : "Item",
	List : "List",

	getDefaults : function(constructor, getList) {
		if (!generics) {
			generics = Iterable.generics;
		} else {
			extend(generics, Iterable.generics, true);
		}
		
		var Item = generics.Item || Iterable.Item,
			List = generics.List || Iterable.List,

			/** Get/set current length of the list */
			getLength = generics.getLength || function getLength(list, newLength) {
				if (typeof newLength == "number") list.length = newLength;
				return list.length;
			},			

			/** Get item from the list */
			getItem = generics.getItem || function getItem(list, index) {
				return list[index];
			},
			
			/** Set item in the list */
			setItem = generics.setItem || function setItem (list, index, item, notify) {
				list[index] = item;
				if (index + 1 > getLength(list)) getLength(list, index + 1);
				if (notify != false && list.notify) list.notify("set"+Item, {item:item, index:index});
				return list;
			},
			
			/** Clear the item at index, leaving the rest of the list alone.
			   Will update length if removed last item from the list. */
			clearItem = generics.clearItem || function clearItem(list, index, notify) {
				var length = getLength(list);
				if (index >= length) return list;
				var item = list[index];
				delete list[index];
				if (index == length -1) getLength(index);
				if (notify != false && list.notify) list.notify("clear"+Item, {item:item, index:index});
				return list;
			},
			
			setList : "set"+List,
			addList : "add"+List
		;

		var methods = {
			length : 0,
			iterable : true,
			
			//
			// mutators that we will often override per class
			//
	
			//
			// generic mutators we shouldn't need to override
			//	as all work in terms of getItem/setItem/clearItem above
			//
	
			getItem : function(index){return getItem(this, index);},
			setItem : function(index, item, notify){return setItem(this, index, item, notify);},
			clearItem : function(index, notify){return clearItem(this, index, notify);},
			
			/** Add an item to this list, moving things later in the list down one spot to make room.
				@param item Item to add.
				@param {Number} [index=end of list] Index of where to put the item.
			 */
			add : function add(item, index, notify) {
				if (index == null) index = getLength(this);
				for (var i = getLength(this); i > index; i--) {
					setItem(this, i, getItem(this, i-1), false);
				}
				setItem(this, index, item, false);
				if (notify != false && this.notify) this.notify("add"+Item, {item:item, index:index});
				return this;
			},
			
			/** Add a list of things to the array at [index]. */
			"add"+List : function addList(list, index, notify) {
				if (list == null || !getLength(list)) return;
				for (var i = 0, length = getLength(list); i < length; i++) {
					this.add(list, index++, notify);
				}
				return this;
			},

			/** Set the list to another list. */
			"set"+List : function setList(newList, notify) {
				this.clear(false);
				for (var i = 0, last = getLength(newList); i < last; i++) {
					setItem(this, i, newList[i]);
				}
				if (notify != false && this.notify) this.notify("set"+List, {items:newList});
				return this;
			},
	
			
			/** Remove all occurances of item from the list, smooshing empty spaces in list.
				Updates length property.
				@param item Item to remove.
			 */
			remove : function remove(item, notify) {
				for (var i = getLength(this) - 1; i >= 0; i--) {
					if (getItem(this, i) == item) this.removeItem(i, false);
				}
				if (notify != false && this.notify) this.notify("remove"+Item, {item:item});
				return this;
			},
	
			/** Remove the item at index, removing the empty space in the list. */
			removeItem : function removeItem(index, notify) {
				var length = getLength(this);
				if (index > length) return this;
				var item = getItem(index);
				for (var i = length - 1; i > index; i--) {
					setItem(this, i-1, this[i], false);
				}
				clearItem(this, length-1, false);
				if (notify != false && this.notify) list.notify("remove"+Item, {item:item});
				return list;
			},

			/** Completely empty the list. */
			clear : function clear(notify) {
				for (var i = getLength(this) - 1; i >= 0; i--) {
					clearItem(this, i, false);
				}
				if (notify != false && this.notify) this.notify("clear"+Item);
				return this;
			},
	
			/** Replace all occurances of oldItem with newItem */		
			replace : function replace(oldItem, newItem, notify) {
				for (var i = 0, length = getLength(this); i < getLength; i++) {
					if (getItem(this, i) == oldItem) setItem(this, i, newItem, false);
				}			
				if (notify != false && this.notify) this.notify("replace"+Item, {items:newList});
				return this;
			},
			
			/** Add item to the end of the list. */
			append : function append(item, notify) {
				this.add(item, getLength(this), notify);
				return this;
			},
			
			/** Add item to the front of the list */
			prepend : function prepend(item, notify) {
				this.add(item, 0, notify);
				return this;
			},
			
			/** Remove any null items from the list. */
			compact : function compact(notify) {
				this.remove(null, notify);
				return this;
			},
			
			/** Splice items -- add or remove from list. 
				Same semantics as array.splice(), except it returns full list (rather than removed items).
			*/
			splice : function splice(index, howMany, newItem, newItem2, etc) {
				if (index == -1) index = getLength(this) - index;
	
				if (howMany != null) {
					for (var i = 0; i < howMany; i++) {
						clearItem(this, index);
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
			sort : function sort(sorter, descending) {
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
				this["set"+List](array, false);
				return this;
			},	
			
			
			// accessors which we shouldn't need to override
			
			/** Return true if this list contains the item. */
			contains : function contains(item, start) {
				return this.indexOf(item, start) > -1;
			},
			
			/** Return the first index of item in the list. */
			indexOf : function indexOf(item, start) {
				if (start == null) start = 0;
				for (i = start, length = getLength(this); i < length; i++) {
					if (getItem(this, i) == item) return i;
				}
				return -1;
			},
	
			/** Return the last index of item in the list. */
			lastIndexOf : function lastIndexOf(item, start) {
				if (start == null) start = getLength(this) - 1;
				for (i = start; i >= 0; i--) {
					if (getItem(this, i) == item) return i;
				}
				return -1;		
			},
			
			/** Return a slice of this list. */
			slice : function slice(start, end) {
				if (start < 0) start = getLength(this) - start;			
				if (end == null) end = getLength(this);
				var newList = new this.constructor();
				for (var i = start; i < end; i++) {
					setItem(newList, i, getItem(this, i), false); 
				}
				return newList;
			},
			
			/** Return a new list of same type with same elements as this. */
			clone : function clone() {
				var it = new this.constructor();
				it["set"+List](this, false);
				return it;
			},
			
			/** Convert this list (or a portion of it) to a vanilla Array */
			toArray : function toArray(start, end) {
				if (start == null) start = 0;
				else if (start < 0) start = getLength(this) - start;
				if (end == null) end = getLength(this);
				var array = new Array();
				for (var i = start; i < end; i++) {
					array.push(getItem(this, i));
				}
				return array;
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
							results[i] = method(getItem(this, i), i);
						}				
					} else {
						var args = Array.args(arguments);
						for (var i = 0; i < this.length; i++) {
							args[0] = getItem(this, i);
							args[1] = i;
							results[i] = method.apply(context, args);
						}				
					}
				}
				else if (typeof method == "string") {
					var args = context;
					for (var i = 0, length = getLength(this); i < length; i++) {
						var item = getItem(this, i);
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
	
				results.length = getLength(this);
				return results;
			},
			
			/* Return first item for which selector is true. 
				@param selector Function or string name of function to invoke on each item in list.
			*/
			select : function select(selector, context) {
				if (selector == null) return getItem(this, 0);
				return this.selectAll(selector, context, true);
			},
			
			/* Return new list (of same type) where selector is true.
				@param selector Function or string name of function to invoke on each item in list.
			*/
			selectAll : function selectAll(selector, context, _returnAfterOne) {
				if (selector == null) return this.clone();
				var results = (_returnAfterOne ? null : new this.constructor()),
					item, 
					result
				;
				if (typeof selector == "function") {
					for (var i = 0, length = getLength(this); i < length; i++) {
						item = getItem(this, i);
						if (context) {
							result = selector.call(context, item, i);
						} else {
							result = selector(item, i);
						}
						if (result) {
							if (_returnAfterOne) {
								return item;
							} else {
								setItem(results, getLength(results), item, false);
							}
						}
					}				
				}
				else if (typeof selector == "string") {
					var args = context;
					for (var i = 0, length = getLength(this); i < length; i++) {
						var item = getItem(this, i);
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
								setItem(results, getLength(results), item, false);
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
			getProperty : function getProperty(key) {
				return this.forEach(function(item) {
					if (item) return item[key];
				});
			},
	
			/** Return true of all items in the list are truthy for method.
				Same calling semantics as forEach().
			 */
			all : function all(method, context) {
				return getLength(this.selectAll(method, context)) != getLength(this);
			},
			
			/** Return true of at least one item in the list is truthy for method.
				Same calling semantics as forEach().
			 */
			some : function some(method, context) {
				return getLength(this.selectAll(method, context, true)) > 1;
			}
		};
		return methods;
	}
});
