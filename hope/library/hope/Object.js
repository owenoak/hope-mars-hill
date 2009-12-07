// :: Object extensions ::


// if override != true, we will skip keys where it.hasOwnProperty(key)
// if recurse == true, we will recursively extend any object properties of source
//		NOTE:  do NOT call use recurse with anything other than simple objects
function extend(it, source, override, recurse) {
	if (!it || !source) return it;
	override = (override != false);
	var itsValue, sourceValue, getter, setter;
	
	for (var key in source) {
		itsValue = it[key];
		sourceValue = source[key];
		
		if (sourceValue instanceof Descriptor) {
			Object.defineProperty(it, key, sourceValue);
			continue;
		}

		// if we have an anonymous function, assign the key as the '_name'
		//	this is required for asSuper() calls to work
		if (typeof sourceValue == "function" && !sourceValue.name && !sourceValue._name) {
			sourceValue._name = key;
		}

		if (recurse == true && sourceValue && typeof sourceValue == "object") {
			it[key] = extend(itsValue || {}, sourceValue, override, recurse);
			continue;
		}

		if (override == false || !it.hasOwnProperty(key)) {
			it[key] = sourceValue;
		}
	}

	return it;
}

// syntactic sugar
function recursivelyExtend(it, source, override) {
	return extend(it, source, override, true);
}

// NOTE: recurse explicitly not allowed here
function extendThis(source, override) {
	return extend(this, source, override);
}

// NOTE: recurse explicitly not allowed here
function extendPrototype(source, override) {
	return extend(this.prototype, source, override);
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

