// :: Object extensions ::
// ==> extend it with source1 and source2 and etc
//	note: this maps getters and setters automaticaly
//		you can define them in your source objects as:
//			{	get fieldName() {...},
//				set fieldName(v){...}
//			}
//
//	If you pass only one "source", "it" will be "this":
//		in global scope, "this" will be the window
//		when assigned as a method of an object, "this" will be that object

function extend(it, source) {
	if (!source) return it;
	for (var key in source) {
		var getter = source.__lookupGetter__(key),
			setter = source.__lookupSetter__(key)
		;
		if (getter || setter) {
			if (getter) it.__defineGetter__(key, getter);
			if (setter) it.__defineSetter__(key, setter);
		} else {
			var value = source[key];
			it[key] = value;

			// if we have an anonymous function, assign the key as the '_name'
			//	this is required for asSuper() calls to work
			if (typeof value == "function" && !value.name) value._name = key;
		}
	}
	// pick up properties that need to be assigned manually
// THIS IS BREAKING FOR SIMPLE CLASSES
//	if (source.toString != it.toString && !it.hasOwnProperty("toString")) 
//		it.toString = source.toString;

	return it;
}

function extendThis(source) {
	return extend(this, source);
}

function extendPrototype(source) {
	return extend(this.prototype, source);
}


// set the prototype of one "dest" to "source"
//	NOTE: only works if __proto__ is defined
//			(eventually could be a shallow copy of attrs on source)
function setPrototype(dest, source) {
	// if we can access the __proto__ property, use that to do a real prototype assignment
	if (dest.__proto__) {
		dest.__proto__ = source;

	// otherwise copy the methods/properties
	} else {
		// TODO
		console.warn("setProto():  setting proto not implemented when __proto__ not available");
	}
}


// return an object whose protoype points to the source object
function clone(source, extraProps) {
	function cloner(){}
	cloner.prototype = source;
	var clone = new cloner();
	if (extraProps) {
		if (clone.extend) 	clone.extend(extraProps);
		else				extend(clone, extraProps);
	}
	return clone;
}



// ==> convert <object> to array of strings as:  <key><separator><value>
Object.toArray = function toArray(object, separator, quotify) {
	if (!separator) separator = "";
	var results = [], value;
	for (var key in object) {
		value = (quotify ? '"'+ (""+object[key]).makeDoubleQuoteSafe() + '"' : object[key]);
		results.push(key + separator + value);
	}
	return results;
}


// add one or more items to the array contained in map[name]
Object.addToMap = function addToMap(map, name, value) {
	if (!map[name]) map[name] = [];
	if (value.forEach) {
		map[name] = map[name].concat(value);
	} else {
		map[name].push(value);
	}
}



// dumb serializers
//	TODO: make smarter later
//	TODO: rename?
function serialize(it) {
	if (it && it.serialize) return it.serialize();
	return escape(JSON.stringify(it));
}

function deserialize(string) {
	return JSON.parse(unescape(string));
}


// return a new object literal with the unique (non-function) properties of an object
function uniquePropertiesOf(it) {
	var output = {};
	for (var key in it) {
		var value = it[key];
		
		if (	typeof value == "function" 
			||  key == "prototype"
			|| 	!it.hasOwnProperty(key)
		   ) continue;
		output[key] = it[key];
	}
	return output;
}
