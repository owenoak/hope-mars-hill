/** 
	@name Tree
	@mixesin TreeLike
	@class 
 */
new Class({
	name : "Tree",
	mixin : "TreeLike",
	defaults : {
		initialize : function(properties, items) {
			this.asClass(properties);
			if (items) this.setTo(items);
		}
	}
});
