/**
	Class constructor

	TODO:		- have an 'attributes' Class property which creates default setters?

**/

(function() {		// hide from global scope

	window.__constructingAClass__ = false;

	// class creator syntax implementing the above
	window.Class = function Class(properties) {
		if (window.__constructingAClass__) return;
		var className = properties.name,
			Super = properties["super"] || properties["Super"] || Class
		;
		if (typeof Super != "function") Super = window[Super];

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
		constructor["as"+className] = Class.makeSuperCaller(constructor);

		// add to the list of classes under the normal name and the lower case version of the name
		Classes.add(className, constructor);

		// have to constructor remember its class name
		constructor.ClassName = className;
		constructor.Super = Super;

		prototype["as"+className] = Class.makeSuperCaller(constructor.prototype);
		prototype.constructor = constructor;		// do I need to assign this?

		// if there are any mixins, add them now BEFORE defaults are added to the class
		if (properties.mixin) {
			properties.mixin.split(",").forEach(function(mixin) {
				if (typeof mixin == "string") mixin = window[mixin];
				mixin.mixinTo(constructor);
			});
		}

		// add instance and class defaults (methods and properties)
		if (properties.defaults) {
			extend(prototype, properties.defaults);
			constructor.defaults = properties.defaults;
		}
		if (properties.classDefaults) {
			extend(constructor, properties.classDefaults);
			constructor.classDefaults = properties.classDefaults;
		}

		// if the properties has an initialize method, call it on the constructor
		if (properties.initialize) properties.initialize.call(constructor);
	}


	/** Classes manages the list of classes.  
		Use Classes.get(name) to return a pointer to a class. 
	*/
	window.Classes = new Collection({global:true, caseSensitive:false, name:"Classes"});
	Classes.add("Class", Class);
	

	// return a function to call a method on the constructor as this class
	Class.makeSuperCaller = function makeSuperCaller(context) {
		return function callAs() {
			var methodName = callAs.caller.name || callAs.caller._name;
			if (!methodName) throw 'In order to call superclass methods in this way, function must have a name';
			var method = context[methodName];
//console.group("Calling ",methodName," on ",context, " from ", callAs.caller);
//console.log(method+"");
//console.groupEnd();
			if (method) return method.apply(this, arguments);
		}		
	}

	// properties/methods available to all Classes (constructors)
	extend(Class, {
		ClassName : "Class",
		asClass : Class.makeSuperCaller(Class),

		// make the instance globally addressable by assigning a unique globalId
		//	if instance.globalId is already present, uses that
		//	if instance.globalId is NOT already present, generates one based on constructor.ClassName
		//	also assigns instance.globalRef as a string that can be eval()d to point back to the instance
		makeGloballyAddressable : function makeGloballyAddressable(instance) {
			// make sure there is a Collection object assigned globally
			if (!this.Collection) {
				if (!this.collection) this.collection = this.ClassName + "s";
				window[this.collection] = this.Collection = new Collection({name:this.collection});
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

		asClass : Class.makeSuperCaller(Class.prototype),
		makeGloballyAddressable : function makeGloballyAddressable() {this.constructor.makeGloballyAddressable(this)},

		toString : function toString() {
			if (this.globalRef) return "["+this.globalRef+"]";
			var name = (this == this.constructor.prototype ? "prototype" : this.id || this.name);
			return "["+this.constructor.ClassName+" "+name +"]";
		},

		// extend this element with new methods
		extend : extendThis,
		set : function set(key, value) {
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
		observe : function observe(event, target) {
			if (!this.observers) this.observers = new ListMap();
			this.observers.addTo(event, target);
		},
		
		notify : function notify(event) {
			var observers = (this.observers ? this.observers[event] : null);
			if (observers) {
				var methodName = "on"+event;
				arguments[0] = this;
				observers.forEach(function(observer) {
					if (observer[methodName]) observer[methodName].apply(observer, arguments);
				});
			}
		},
		
		
		//
		// defer some action and keep extending deferral period if called again before timer goes off
		//
		delay : function delay(callback, interval, timerName) {
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
		
		clearDelay : function clearDelay(timerName) {
			if (!this._timers) this._timers = {};
			if (timerName) {
				clearTimeout(this._timers[timerName]);
				delete this._timers[timerName];
			}
		}
		
	}
	// map of "key" -> "setKey" for setters
	var Setters = {};

})();
