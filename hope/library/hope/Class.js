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

		// special case Array
		if (Super == Array) {
			var constructor = subclassArray(ClassName);
			var prototype = constructor.prototype;
		} else {
			// create the constructor method
			var constructor = function Constructor(){
				if (window.__constructingAClass__) return;
				this.initialize.apply(this, arguments);
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
		
		constructor["as"+ClassName] = _constructorSelfCaller(constructor);

		// add to the list of classes under the normal name and the lower case version of the name
		Classes[ClassName] = Classes[ClassName.toLowerCase()] = constructor;

		// have to constructor remember its class name
		constructor.ClassName = ClassName;
		constructor.Super = Super;

		prototype["as"+ClassName] = _prototypeSelfCaller(constructor);
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
		var iframe = document.createElement("iframe").setStyle({position:"absolute",left:-1000,top:-1000});
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


	// return a function to call a method on the constructor as this class
	function _constructorSelfCaller(constructor) {
		return function callAs() {
			var methodName = callAs.caller.name || callAs.caller._name;
			if (!methodName) throw 'In order to call superclass methods in this way, function must have a name';
			var method = constructor[methodName];
			if (method) return method.apply(this, arguments);
		}
	}

	// return a function to call a method on the prototype as this class
	function _prototypeSelfCaller(constructor) {
		return function callAs() {
			var methodName = callAs.caller.name || callAs.caller._name;
			if (!methodName) throw 'In order to call superclass methods in this way, function must have a name';
			var method = constructor.prototype[methodName];
			if (method) return method.apply(this, arguments);
		}
	}

	// properties/methods available to all Classes (constructors)
	extend(Class, {
		ClassName : "Class",
		asClass : _constructorSelfCaller(Class),

		getClass : function getClass(ClassName) {
			return Classes[ClassName] || Classes[(ClassName || "").toLowerCase()];
		},
		
		// make the instance globally addressable by assigning a unique globalId
		//	if instance.globalId is already present, uses that
		//	if instance.globalId is NOT already present, generates one based on constructor.ClassName
		//	also assigns instance.globalRef as a string that can be eval()d to point back to the instance
		makeGloballyAddressable : function(instance) {
			// make sure there is a Collection object assigned globally
			if (!this.Collection) {
				if (!this.collection) this.collection = this.ClassName + "s";
				window[this.collection] = this.Collection = {};
				this.globalIdSequence = 0;
			}
			
			var id = instance[this.globalIdProperty];
			if (typeof id == "string") id = id.makeLegalId();

			// DEBUG: if item with globalId is already found, assign under id and warn?
			
			if (typeof id != "string" || this.Collection[id] != null) {
				var base = (id || this.ClassName + "_").makeLegalId();
				while (this.Collection[base + this.globalIdSequence]) {
					this.globalIdSequence++;
				}
				id = base + this.globalIdSequence;
			}
			this.Collection[id] = instance;
			instance[this.globalIdProperty] = id;
			instance.globalRef = this.collection + "." + id;			
		},
		// sequence for creating global ids for controls
		globalIdProperty : "id",
		globalIdSequence : 0,

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

		asClass : _prototypeSelfCaller(Class),
		makeGloballyAddressable : function() {this.constructor.makeGloballyAddressable(this)},

		toString : function toString() {
			if (this.globalRef) return "["+this.globalRef+"]";
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
		},
		
		
		//
		// observe/notify pattern
		//
		observe : function(event, target) {
			if (!this.observers) this.observers = new ListMap();
			this.observers.addTo(event, target);
		},
		
		notify : function(event) {
			var observers = (this.observers ? this.observers[event] : null);
			if (!observers) return;
			var methodName = "on"+event;
			arguments[0] = this;
			observers.forEach(function(observer) {
				if (observer[methodName]) observer[methodName].apply(observer, arguments);
			});
		},
		
		
		//
		// defer some action and keep extending deferral period if called again before timer goes off
		//
		delay : function(callback, interval, timerName) {
			if (typeof callback == "string") callback = this[callback];
			if (timerName) this.clearDelay(timerName);
			if (!interval) return callback.apply(this);

			var timer = setTimeout(
					function(){
						this.clearDelay(timerName);
						callback.apply(this);
					}.bind(this),
					(interval || .1) * 1000
				);
			if (timerName) this._timers[timerName] = timer;
		},
		
		clearDelay : function(timerName) {
			if (!this._timers) this._timers = {};
			if (timerName) {
				clearTimeout(this._timers[timerName]);
				delete this._timers[timerName];
			}
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
	Mixin.asMixin = _constructorSelfCaller(Mixin);
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

		asAMixin : _prototypeSelfCaller(Mixin)
	}

})();
