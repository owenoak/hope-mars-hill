
/** Super simple class to manage a collection of things.  
	Use add() and get() to access rather than hitting directly. 
*/
function Collection(options) {
	if (!options) options = Collection.options;
	
	this._list = [];
	
	this.add = options.add || function(name, it) {
		this._list.push(it);
		this[""+name] = it;
		if (options.caseSensitive != true) this[(""+name).toLowerCase()] = it;
		if (options.global) window[name] = it;
	}
	
	this.get = options.get || function(name) {
		if (!name) return;
		if (typeof name != "string") return name;
		var it = this[name];
		if (!it && options.caseSensitive) it = this[name.toLowerCase()];
		return it;
	}
	
	this.forEach = function(method, context) {
		return this._list.forEach(method, context);
	}
	
	this.toString = function() {
		return "[Collection" + (options.name ? " "+options.name : "") + "]";
	}
}

Collection.options = {
	global : false,
	caseSensitive : false
}
