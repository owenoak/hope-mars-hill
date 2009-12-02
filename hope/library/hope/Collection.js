// ::
// :: Collections ::
// ::
//
//	A collection is a set of things which is indexed by id 
//	 AND can be iterated using normal Iterable methods (forEach, etc).
//
//	To access items in the collection by id:  	collection.get(id)
//	To add something to the collection:			collection.add(it [,id])
//		(if id is not defined, will attempt to use 	(it.id || it.name)
//			and will skip addition if id cannot be found				)
//	To get the list of ids in the collection	collection.keys
//
//	TODO: 	- add debugging for adding null items to the collection, id not found
//		 	- setItem() semantics are wacky
//			- ".name" is not necessarily unique -- safe to add by name?

new Class({
	name : "Collection",
	
	defaults : {
		caseSensitive : true,

		initialize : function(properties) {
			this.set(properties);
			this.items = {};
			this.__defineGetter__("length", function(){return this.keys.length});
			this.keys = [];
		},

		add : function(it, key) {
			if (!it) return;	// TODEBUG
			
			if (key == null) key = it.id || it.name;
			// if no key found or passed, skip the add
			if (!key) return;	// TODEBUG
	
			if (this.caseSensitive == false) key = (""+key).toLowerCase();

			var wasPresent = this.items[key] != undefined;
			this.items[key] = it;
	
			// add to the list of keys (so we can iterate)
			if (!wasPresent) this.keys.push(key);
		},
		
		get : function(key) {
			if (this.caseSensitive == false) key = (""+key).toLowerCase();
			return this.items[key];
		},
		
		
		// iterator methods
		item : function(index) {
			return this.items[this.keys[index]];
		},
		
		setItem : function(key, it) {
			if (this.caseInsensitive) key = (""+key).toLowerCase();
			this.items[key] = it;
		}
	}
});

// add all Iterator methods to Collections
Array.makeIterable(Collection);

