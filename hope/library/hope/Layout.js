// ::
// ::	Layout
// ::
//
//	Layouts are used as singletons, but can be created as classes (since they share implementation)
//	Therefore, the layout does not keep any data inside the object itself.
//	If the layout wants to cache any calculated data for a particular set of parents/children
//		it should set a property on the parent object.
//	


new Class({
	name : "Layout",
	collection : "Layouts",
	
	defaults : {
	
		wrapChildren : false,					// if true, we wrap child elements in a container on setup
		layoutClassName : "Layout",				// CSS class for the layout's enclosing element
		
		wrapCells : false,						// if true, we wrap each cell in a container on setup
		cellClassName	: "LayoutCell",			// CSS class for each cell's enclusing element (if defined)

		// Initialize the layout for the parent.children within parentElement.
		//	This will often make one or more containing elements, etc.
		setup : function(parent, parentElement) {},

		// resize the children according to the size of the parent
		layout : function(parent, parentElement) {}

	}
});

Debuggable.applyTo(Layout, "Layout");
Debuggable.applyTo(Layout.prototype, "Layout");


// "flow" layout -- doesn't do anything (eg: lets the browser do the work)
new Layout({
	name:"flow"
});


new Layout({
	name:"center",
	layout : function(parent, parentElement) {
		if (parentElement == null && parent instanceof Element) parentElement = parent;
		
		var children = parent.elements;
		if (!children || !children.length) return;
		
		var parentWidth = parentElement.innerWidth,
			parentHeight = 0
		;
		
		// if parentWidth is not defined, defer
		if (parentWidth <= 0) {
			this._debug("layout(",parent,",",parentElement,"): deferring because can't find size of parent");
			this.setTimeout( this.layout.bind(this), 10);
		}
		
		// get widths of children
		// TODO: may need to defer if children can't be sized
		children.forEach(function(child) {
			var childWidth = child.width, childHeight = child.height;
			if (childWidth) child.left = (parentWidth - childWidth) / 2;
			child.top = parentHeight;
			parentHeight += childHeight;
		});
		
		parentElement.height = parentHeight;
	}
});
	