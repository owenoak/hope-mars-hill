//	
//	Getter/setter manipulation
//


//
// define a Descriptor object, used in extend above
//
function Descriptor(options) {
	if (options) for (var key in options) {
		this[key] = options[key];
	}
}

function SmartSetter(options) {
	Descriptor.call(this, options);
}
SmartSetter.prototype = new Descriptor({
	smart:true,
	assignTo : function(assignee, key) {
		var setter = this.set,
			defaultValue = this.value
		;
		function smartGetter() {
			return defaultValue;
		}
		function smartSetter(newValue) {
			// remember the original value, because deleting assignee[key] below may clear it
			var oldValue = this[key];
			
			// special case: 
			//	if we're assigning directly to 'assignee', 
			//	   just update the defaultValue
			if (this == assignee) {
				defaultValue = setter.call(this, newValue, defaultValue);
				return defaultValue;
			}
			
			// clear the getter and setter on the original object
			delete assignee[key];
			
			// call the actual setter, assigning the results directly to this object
			var results = setter.call(this, newValue, oldValue);
			this[key] = results;
			
			// now set up the getter and setter again on the assignee
			assignee.__defineSetter__(key, smartSetter);
			assignee.__defineGetter__(key, smartGetter);
			
			// and return the results
			return results;
		}
		// debug: have the getter/setters remember their assignment
		smartGetter.key 	 = smartSetter.key 		= key;
		smartGetter.assignee = smartSetter.assignee = assignee;
		
		assignee.__defineGetter__(key, smartGetter);
		assignee.__defineSetter__(key, smartSetter);
	}
});






//
//	Partial implementation of ES5 "defineProperty" routine.
//
//	NOTE: this handles smartSetters automatically
//
Object.defineProperty = function defineProperty(object, key, descriptor) {

	// handle special descriptors which have an 'assignTo' method
	if (descriptor.assignTo) {
		descriptor.assignTo(object, key);
		return;
	}
	
	// otherwise try to get getters/setters
	var getter = descriptor.get,
		setter = descriptor.set
	;
	if (getter || setter) {
		if (getter) object.__defineGetter__(key, getter);
		if (setter) object.__defineSetter__(key, setter);
		return;
	}
	
	// if no getters/setters, just assign value
	object[key] = descriptor.value;
}


