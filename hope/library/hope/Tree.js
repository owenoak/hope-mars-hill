/** 
	@name List
	@mixins Iterable
	@class 
 */
new Class({
	name : "Tree",
	mixin : "Heirarchical",
	defaults : {
		initialize : function(properties) {
			this.asClass(properties);
			this.initializeTree();
		}
	}
});
