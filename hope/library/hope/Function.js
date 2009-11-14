// ::
// :: Function extensions
// ::

extend(Function.prototype, {

	// bind a function to a target object with optional arguments
	//
	// NOTE: Use function.isBoundTo() to figure out if a function was bound to another function
	//
	bind : function(target, boundArgs) {
		var originalMethod = this, boundMethod;

		// special case if no bound arguments to skip the Array.combine step on the call
		if (boundArgs == undefined) {
			var boundMethod = function boundMethod(){	
				return originalMethod.apply(target, arguments);
			};
		} else {
			boundMethod = function boundMethod(){
				var args = Array.combine(boundArgs, arguments);
				return originalMethod.apply(target, args);
			}
		}
		boundMethod.__originalMethod = originalMethod;
		boundMethod.__target = target;

		return boundMethod;
	},
	
	// variation of bind to use when binding for an event handler
	bindForEvent : function(target, boundArgs) {
		var originalMethod = this, boundMethod;

		boundMethod = function boundMethod(event){
			var args = Array.combine([event||window.event], boundArgs, arguments);
			return originalMethod.apply(target, args);
		}
		boundMethod.__originalMethod = originalMethod;
		boundMethod.__target = target;

		return boundMethod;
	},
	
	// return true if this method was bound to otherMethod+target via function.bind()
	isBoundTo : function(otherMethod, target) {
		return (this.__originalMethod == otherMethod) && (this.__target == target);
	}

});