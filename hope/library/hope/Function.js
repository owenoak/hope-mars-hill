// ::
// :: Function extensions
// ::

extend(Function.prototype, {

	// bind a function to a target object with optional arguments
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
	}
});
