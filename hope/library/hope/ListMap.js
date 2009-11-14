
// ::
// ::	ListMap -- a map of {key:[]} objects
// ::
(function(){
	window.ListMap = function ListMap(name) {
		if (name) this.name = name;
	}

	// Add value into specified list.
	// NOTE: Nothing is stopping you from adding the same value twice.
	function addTo(listName, value) {
		var list = this[listName] || (this[listName] = []);
		list[list.length] = value;
	}
	
	// Remove item from specified list where condition is true and return it
	//	SIDE EFFECT:  If list is then empty after remove, deletes list from ListMap.
	//
	//	in condition method, arguments to the function are:  item, index
	function removeFrom(listName, condition) {
		var list = this[listName];
		if (!list) return;
		for (var i = 0; i < list.length; i++) {
			var it = list[i];
			if (condition(it, i)) {
				list.splice(i, 1);
				if (list.length == 0) delete this[listName];
				return it;
			}
		}
	}

	// return true if specified list contains a value
	function listContains(listName, value) {
		var list = this[listName];
		if (!list) return false;
		return list.indexOf(value) > -1;
	}

	ListMap.prototype = {
		addTo : addTo,
		removeFrom : removeFrom,
		listContains : listContains,
		toString : function() {
			return "[ListMap " + (this.name ? this.name : "anonymous") + "]";
		}
	}

	ListMap.toString = "[ListMap]";
})();

