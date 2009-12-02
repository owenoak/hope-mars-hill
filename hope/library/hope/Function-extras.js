// ::
// :: Function extras which aren't loaded by default
// ::

extend(Function.prototype, {
	
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
