/** 
	@name List
	@mixins Iterable
	@class 
 */
new Class({
	name : "List",
	mixin : "Iterable",
	defaults : {
		initialize : function() {
			if (arguments.length > 0) this.setList(arguments);
		},
		toString : function() {
			return "[list]";
		}
	}
});
