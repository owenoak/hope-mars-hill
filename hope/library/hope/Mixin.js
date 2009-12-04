(function() {		// hide from global scope

	// Mixin constructor
	// 	pass in properties object with:
	//		name				(required) name of the mixin
	//		defaults			(required) methods/properties to mix in to each constructor.prototype
	//		classDefaults		(optional) methods/properties to mix in to each constructor
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
		if (!this.name) throw "Mixin properties must specify a .name";

		if (!this.callAs) this.callAs = "as"+this.name;
		this.Super = Mixins.get(this["super"] || this.Super);
		if (this.Super) setPrototype(this, this.Super);
		
		// list of things we've mixed in to
		this.Mixers = new Collection({global:false, caseSensitive:true, name:this.name+"Mixers"});
		
		this[this.callAs] = Class.makeSuperCaller(this);

		Mixins.add(this.name, this);

		if (this.initialize) this.initialize();
	}

	
	Mixin.asMixin = Class.makeSuperCaller(Mixin);
	
	Mixin.prototype = {
		extend : extendThis,

		// default options for mixing in
		options : {},
		
		mixinTo : function mixinTo(constructor, options) {
			options = extend(options || {}, this.options, false);
			
			this.Mixers.add(constructor.ClassName, constructor);
			
			if (this.Super) {
				this.Super.mixinTo(constructor, options);
			}
	
			// get the defaults (methods+properties) to apply to the constructor
			var defaults = this.getDefaults.apply(this, arguments);
			if (defaults) {
				// actually add them to the constructor prototype
				constructor.prototype.extend(defaults, options.override);

				// install a function which will call the mixin method
				//	of the same name as the current method
				//	NOTE:  'defaults' here MUST point to the actual methods
				//			that will be installed in this object
				//			(since they may be different for different calls to mixin.apply)
				this[this.callAs] = Class.makeSuperCaller(defaults);
			}

			var classDefaults = this.getClassDefaults.apply(this, arguments);
			if (classDefaults) {
				constructor.extend(classDefaults, options.override);
				constructor[this.callAs] = Class.makeSuperCaller(classDefaults);				
			}
			return this;
		},

		getDefaults : function getDefaults(constructor, options){
			return this.defaults;
		},
		getClassDefaults : function getClassDefaults(constructor, options) {
			return this.classDefaults;
		},

		asMixin : Class.makeSuperCaller(Mixin, true),
		
		toString : function() {
			return "[Mixin "+this.name+"]";
		}
	}


	/** Registry of all mixins.
		Use  Mixins.get(name)  to return a reference to a mixin. */
	window.Mixins = new Collection({global:true, caseSensitive:false, name:"Mixins"});
	Mixins.add("Mixin", Mixin);

})();
