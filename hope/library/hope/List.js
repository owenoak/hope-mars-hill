/** 
	@name List
	@mixesin ListLike
	@class 
 */
new Class({
	name : "List",
	mixin : "ListLike",
	defaults : {
		initialize : function(properties, items) {
			this.asClass(properties);
			if (items) this.setAll(items);
		}
	}
});
