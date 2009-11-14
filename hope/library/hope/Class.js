/**
	Class and Mixin constructors
	
	TODO:		- have an 'attributes' Class property which creates default setters?

**/

(function() {		// hide from global scope

	window.__constructingAClass__ = false;
	
	// class creator syntax implementing the above
	window.Class = function Class(properties) {
		if (window.__constructingAClass__) return;
		var ClassName = properties.name,
			Super = properties["super"] || properties["Super"] || Class
		;
		if (typeof Super != "function") Super = window[Super];

		// if a collection is called for and one is not defined, create it now
		var collection = properties.collection;
		if (collection && typeof collection == "string" && !window[collection]) {
			collection = window[collection] = new Collection({name:collection});
		}

		if (Super == Array) {
			var constructor = subclassArray(ClassName);
			var prototype = constructor.prototype;
		} else {
			// create the constructor method
			var constructor = function Constructor(){
				if (window.__constructingAClass__) return;
				this.initialize.apply(this, arguments);
				if (collection) collection.add(this);
			};

			// set up the superclass (defaulting to Class if none provided)
			// 	NOTE: use the global __constructingAClass__ flag to NOT call init on the superclass' prototype
			// 			this is safe because all constructors are guaranteed to finish immediately
			//			without calling anything else if this flag is set
			window.__constructingAClass__ = true;
			var prototype = constructor.prototype = new Super();
			window.__constructingAClass__ = false;

			// set the __proto__ of the constructor to the superclass
			//	this makes the constructor inherit methods/props from the superclass
			setPrototype(constructor, Super);
		}
		
		// add to the list of classes under the normal name and the lower case version of the name
		Classes[ClassName] = Classes[ClassName.toLowerCase()] = constructor;

		// TODO: create the collection globally if not defined?

		// have to constructor remember its class name
		constructor.ClassName = ClassName;
		constructor.Super = Super;
				
		prototype["as"+ClassName] = _getSelfCaller(ClassName);
		prototype.constructor = constructor;		// do I need to assign this?
	
		// if there are any mixins, add them now
		if (properties.mixin) {	
			properties.mixin.split(",").forEach(function(mixin) {
				if (typeof mixin == "string") mixin = window[mixin];
				var mixinName = mixin.name;
				mixin.apply(constructor);
			});
		}
	
		// add instance and class defaults (methods and properties)
		if (properties.defaults) extend(prototype, properties.defaults);
		if (properties.classDefaults) extend(constructor, properties.classDefaults);
	
		// assign the constructor globally under the ClassName
		window[ClassName] = constructor;
		
		// if the properties has an initialize method, call it on the constructor
		if (properties.initialize) properties.initialize.call(constructor);
	}


	// special function to subclass array (since there's no better way to do it that works)
	function subclassArray(ClassName) {
		var iframe = document.createElement("iframe").set({position:"absolute",left:-1000,top:-1000});
		document.body.appendChild(iframe);
		
		var frameDoc = frames[frames.length - 1];
		// write a script into the <iframe> and steal its Array object
		frameDoc.document.write("<script>parent."+ClassName+" = Array;<\/script>");
		frameDoc.document.close();

		var constructor = window[ClassName];

		// copy all array properties to the constructor
		for (var key in Array) {
			constructor[key] = Array[key];
		}
		Array.makeIteratable(constructor);
		return constructor;
	}


	window.Classes = {
		Class 	: Class,
		"class"	: Class
	};


	// return a Class for a class name
	hope.getClass = function getClass(ClassName) {
		return Classes[ClassName] || Classes[(ClassName || "").toLowerCase()];
	}

	// return a function to call a method on this class name
	// NOTE: we construct the function with an eval() for ease of debugging
	//			even though it's slightly less efficient
	function _getSelfCaller(ClassName) {
		var Class = hope.getClass(ClassName);
		return function callAs() {
			var methodName = callAs.caller.name || callAs.caller._name;
			if (!methodName) throw 'In order to call superclass in this way, function must have a name';
			var method = Class.prototype[methodName];
			if (method) return method.apply(this, arguments);
		}
	}
	
	// properties/methods available to all Classes (constructors)
	extend(Class, {
		ClassName : "Class",
	
		// extend the constructor with methods/properties from 'source' object
		// properly handles getters and setters
		extend : extendPrototype,
		extendClass : extendThis,
		toString : function toString() {
			return "[Class "+this.ClassName+"]";
		}
	
	});
	
	// properties/methods applied to all SubClass instances
	Class.prototype = {
		initialize : function initialize(properties){
			this.set(properties);
		},
		
		asClass : _getSelfCaller("Class"),
		
		toString : function toString() {
			var name = (this == this.constructor.prototype ? "prototype" : this.id || this.name);
			return "["+this.constructor.ClassName+" "+name +"]";
		},
		
		// extend this element with new methods
		extend : extendThis,
		
		set : function(key, value) {
			if (arguments.length == 1) {
				var props = key;
				for (key in props) {
					this.set(key, props[key]);
				}
				return;
			}

			var setter = Setters[key] || (Setters[key] = "set"+key.capitalize());
			if (this[setter]) 	this[setter](value);
			else				this[key] = value;
			return this;
		}
	}
	// map of "key" -> "setKey" for setters
	var Setters = {};
	
	
	// Mixin constructor
	// 	pass in properties object with:
	//		name				(required) name of the mixin
	//		getDefaults() 		(optional) returns methods + properties to apply to the constructor.prototype
	//		getClassDefaults()	(optional) returns methods + proeprties to apply to the constructor
	//		initialize()		(optional) initialize the mixin itself (only called once)
	//		apply(constructor)	(optional) apply this mixin to the constructor passed in
	//
	//	TODOC:		* how to do super calls in mixin methods (  this[asSuper]  )
	//				* how to do a manual apply
	//
	//	NOTE:  I'm pretty sure that when two mixins override the same function
	//				that the first one will be lost.  It may be possible to fix this
	//				by getting a pointer to all of the methods actually returned in getDefaults()
	//				as they are implemented AT THE TIME OF MIXIN INSTANTIATION
	//				and having a different "this[asSuper]" syntax 
	//				which goes directly to those functions
	//				
	//		
	window.Mixin = function Mixin(properties) {
		this.extend(properties);

		// call the initializer for the mixin itself
		if (this.initialize) this.initialize();
		window[this.name] = this;
	}
	Mixin.prototype = {
		extend : extendThis,
		apply : function apply(constructor) {
			// get the defaults (methods+properties) to apply to the constructor
			var defaults = this.getDefaults(constructor);
			if (defaults) {
				// actually add them to the constructor prototype
				constructor.prototype.extend(defaults);
				
				// install a function which will call the mixin method
				//	of the same name as the current method
				//	NOTE:  'defaults' here MUST point to the actual methods
				//			that will be installed in this object
				//			(since they may be different for different calls to mixin.apply)
				constructor.prototype["as"+this.name] = function callAs() {
					var methodName = callAs.caller.name,
						method = defaults[methodName]
					;
					if (method) method.apply(this, arguments);
				}
			}
			
			var classDefaults = this.getClassDefaults(constructor);
			if (classDefaults) {
				constructor.extend(classDefaults);
			}
		},
		
		getDefaults : function getDefaults(){},
		getClassDefaults : function getClassDefaults() {},
		
		getSuperCaller : function(constructor) {
			return "as"+constructor.Super.ClassName;
		},
		
		asAMixin : _getSelfCaller("Mixin")
	}
	
})();