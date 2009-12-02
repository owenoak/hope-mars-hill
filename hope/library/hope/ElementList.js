// ::
// :: ElementList
// ::
//		List of elements which can be manipulated (and constructed).
//		Note that these methods are also installed on NodeList and NamedNodeMap
//
//	TODO: 	- make sure concat() and all methods below etc return an ElementList
//			- enhanced selector syntax:  (merge these into general selector ?)
//				- "go up from here" (eg: find parents which match)
//				- "start at document and go down"
//				- "don't recurse to children"
//				- 
//			- some syntax for adding methods to ElementLists later (ala Prototype)
//					eg:  ElementList.addMethods({...})
//				which also adds the methods to NodeList, etc

(function() {
	new Class({
		name : "ElementList",
		Super : Array
	});
	
	ElementList.Methods = {

		// Invoke a named method or function for all sub-elements which match "selector".
		// If no elements matched selector, returns undefined.
		// If exactly one element matches selector, returns result of that call.
		// Otherwise returns array of results of call to each matched element.
		forEachElement : function(selector, method, args) {
			var list = this.selectAll(selector);
			if (list.length == 0) {
				return undefined;

			} else if (list.length == 1) {
				var it = list[0];
				method = (method && typeof method == "function" ? method : it[method]);
				if (!method) return;
				return method.apply(it, args);
				
			} else {
				return list.invoke(method, args);
			}
		},
		
		// Return true if the method invoked is true for all matching elements.
		// If there are no matched elements, returns false.
		// NOTE: this currently iterates over all elements, even after finding the first false one.
		trueForEachElement : function(selector, method, args) {
			var list = this.selectAll(selector);
			if (list.length == 0) return false;
			return this.forEachElement(selector, "hasAttribute", [name]).all();
		},


		//
		// selector semantics -- get sub-element pieces
		//
		
		// return the first sub-elements which match the given selector
		// returns null if no match (or this has no elements)
		//	passing an element simply returns that element
		//	pass empty ("" or null) selector to return the first main element
		//  pass selector starting with "*" to do a global search
		//  pass a number to return the nth main element
		//
		// NOTE: this WILL match our list of elements as well as any descendants
		//
		select : function(selector) {
			if (selector instanceof Element) return selector;
			
			if (selector && selector.charAt(0) == "*") return document.select(selector.substr(1));
			
			if (this.length) {
				// if "" or null selector, return the first element
				if (!selector) return this[0];

				// if a number, return the nth element
				if (typeof selector == "number") return this[selector];
	
				for (var i = 0, element; element = this[i++];) {
					if (element.matches(selector)) return element;
					
					var it = element.select(selector);
					if (it) return it;
				}
			}
		},
		
		// Return list of all sub-elements which match the given selector.
		// Returns empty ElementList if no match.
		//	pass empty ("" or null) selector to return the all main elements
		//  pass selector starting with "*" to do a global search
		selectAll : function(selector) {
			if (selector && selector.charAt(0) == "*") return document.selectAll(selector.substr(1));

			var all = new this.constructor();
			if (this.length) {
				// if "" or null selector, return all elements
				if (!selector) return this;

				// if a number, return an array containing the nth element
				if (typeof selector == "number") {
					all.push(this[selector]);

				} else {
					for (var i = 0, element; element = this.elements[i++];) {
						if (element.matches(selector)) all.push(element);
						
						var list = element.selectAll(selector);
						if (list.length > 0) all = Array.toArray(list, all);
					}
				}
			}
			return all;
		},
		
		
		//
		//	html manipulation
		//
		
		html : function(html, selector) {
			return this.forEachElement(selector, "html", [html]);
		},
		
		//
		//	attribute methods
		//
		//		- these all work on our main element by default
		//		- pass a selector to have them act on sub-elements that match the selector if desired
		//
		
		// return true if ALL elements matching selector have the specified attribute
		hasAttribute : function(name, selector) {
			return this.trueForEachElement(selector, "hasAttribute", [name]);
		},
		
		// set the attribute "name" to "value" for all matching elements
		setAttribute : function(name, value, selector) {
			this.forEachElement(selector, "setAttribute", [name, value]);
			return this;
		},

		removeAttribute : function(name, selector) {
			return this.forEachElement(selector, "removeAttribute", [name]);
		},
		
		// add the attributes of this element to object for all matching elements
		//	returns list of attribute object
		getAttributes : function(selector) {
			return this.forEachElement(selector, "getAttributes");
		},
	
		// Does the list-like attribute contain a certain value?
		// Delimiter is used to split the attribute value up -- default is " ".
		attributeContains : function(name, value, delimiter, selector) {
			return this.trueForEachElement(selector, "attributeContains", [name, value, delimiter]);
		},
	
		// Add valueToAdd to the list-like attribute <name>.
		// Delimiter is used to split the attribute value up -- default is " ".
		addToAttribute : function(name, valueToAdd, delimiter, selector) {
			this.forEachElement(selector, "addToAttribute", [name, valueToAdd, delimiter]);
			return this;
		},
	
		// Remove valueToRemove from the list-like attribute <name>.
		// Delimiter is used to split the attribute value up -- default is " ".
		removeFromAttribute : function(name, valueToRemove, delimiter, selector) {
			this.forEachElement(selector, "removeFromAttribute", [name, valueToRemove, delimiter]);
			return this;
		},
	
		// Toggle the presence of <value> in list-like attribute <name>.
		//	Condition can be:
		//		- undefined : we'll remove <value> if it was present or add it if it was not.
		//		- a function:  executes the function with arguments <name>,<value>
		//		- any other value: we add attribute if value is truthy
		// 	Delimiter is used to split the attribute value up -- default is " ".
		toggleAttribute : function(name, value, condition, delimiter, selector) {
			this.forEachElement(selector, "toggleAttribute", [name, value, condition, delimiter]);
			return this;
		},
	
		//
		// class name manipulation
		//
		hasClass : function(name, selector) {
			return this.trueForEachElement(selector, "hasClass", [name]);
		},
	
		addClass : function(name, selector) {
			this.forEachElement(selector, "addClass", [name]);
			return this;
		},
	
		removeClass : function(name, selector) {
			this.forEachElement(selector, "removeClass", [name]);
			return this;
		},
	
		// if element had the name, removes it -- otherwise adds it
		//	pass condition of function (called with 'this' as element)
		//		boolean, etc to set explicitly  [ see element.toggleAttribute() ]
		toggleClass : function(name, condition, selector) {
			this.forEachElement(selector, "toggleClass", [name]);
			return this;
		},
	
	
		// return the current style for prop (in camelCase form)
		getStyle : function(prop, selector) {
			return this.forEachElement(selector, "get", [prop]);
		},
		
		// set a bunch of styles either as:
		//		string of  "camelCaseProp:blah;otherProp:blah;"
		//  or  object of  {camelCaseProp:'blah', otherProp:'blah'}
		setStyle : function(styles, selector) {
			this.forEachElement(selector, "set", [styles]);
			return this;
		},


		//	
		//	visible semantics
		//
		isVisible : function() {
			if (!this.visible) return false;
			return this.ancestors().all(function(parent) {
				return this.visible;
			});
		},
		
		setVisible : function setVisible(visible, selector) {
			return (visible == false ? this.hide(selector) : this.show(selector));
		},
		
		show : function show(selector) {
			this.forEachElement(selector, "show");
			return this;
		},

		hide : function hide(selector) {
			this.forEachElement(selector, "hide");
			return this;
		},
		

		//	
		//	enable/disable semantics
		//
		setEnabled : function setEnabled(enable, selector) {
			return (enable == false ? this.disable(selector) : this.enable(selector));
		},
		
		enable : function enable(selector) {
			this.forEachElement(selector, "enable");
			return this;
		},
		
		disable : function disable(selector) {
			this.forEachElement(selector, "disable");
			return this;
		},
		

		//
		// size and position
		//
	
		// return true if the element(s)' position is one of 'absolute', 'relative' or 'fixed'
		isPositioned : function(selector) {
			return (this.forEachElement(selector, "isPositioned") || false).all();
		},
	
		//  Make the element absolutely positioned at its current place in the document.
		//	If <toPage> is false, element stays within its container.
		//	If <toPage> is true,  element is re-rooted to <body> element.
		absolutize : function(toPage, selector) {
			this.forEachElement(selector, "absolutize", [toPage]);
			return this;
		},
		

		// first parent with relative/absolute positioning
		offsetParent : function(selector) {
			return this.forEachElement(selector, "offsetParent");
		},
		
		// all ancestors with relative/absolute positioning
		offsetParents : function() {
			return this.forEachElement(selector, "offsetParents");
		},
	
		offsetRect : function() {
			return this.forEachElement(selector, "offsetRect");
		},
	
		// return an object with {left, top, right, bottom, width, height} relative to the page
		rect : function() {
			return this.forEachElement(selector, "rect");
		},
	
	
		// get/set the left of this element relative to the offset parent
		left : function(left) {
			return this.forEachElement(selector, "left", [left]);
		},
		
		// get the left of this element relative to the entire page
		pageLeft : function() {
			return this.forEachElement(selector, "pageLeft");
		},
	
		// get/set the top of this element relative to the offset parent
		top : function(top) {
			return this.forEachElement(selector, "top", [top]);
		},
	
		// return the top of this element relative to the entire page
		pageTop : function() {
			return this.forEachElement(selector, "pageTop");
		},
	
		//
		// get/set outside width/height of the element (including border+padding, not including margin)
		//
		width : function(width) {
			return this.forEachElement(selector, "width", [width]);
		},
	
		height : function(height) {
			return this.forEachElement(selector, "height", [height]);
		},
	
		//
		// get/set content width/height -- does NOT include border, padding or margins
		//
		innerWidth : function(width) {
			return this.forEachElement(selector, "innerWidth", [width]);
		},
	
		innerHeight : function(height) {
			return this.forEachElement(selector, "innerHeight", [height]);
		},
	
	
	
		// return the padding for this element as {left, top, right, bottom}
		padding : function() {
			return this.forEachElement(selector, "padding");
		},
	
		// return the borders for this element as {left, top, right, bottom}
		borders : function() {
			return this.forEachElement(selector, "borders");
		},
	
		// return the margins for this element as {left, top, right, bottom}
		margins : function() {
			return this.forEachElement(selector, "margins");
		},
	
		// TODO: animation
		moveTo : function(left, top) {
			this.forEachElement(selector, "moveTo", [left, top]);
			return this;
		},
	
		// TODO: animation
		//	TODO: may want to set right & bottom if current width is a percentage...
		setRect : function(rect) {
			this.forEachElement(selector, "setRect", [rect]);
		},
	
	
		//
		//	scroll
		//
	
		// TODO: take a speed parameter?
		scrollTo : function(left, top) {
			this.forEachElement(selector, "scrollTo", [left, top]);
		}
	
	};
	
	
	// ::
	// :: NodeList and NamedNodeMap
	// ::
	
	// add ElementList and array iteration methods to ElementList, NodeList, NamedNodeMap
	extend(ElementList.prototype, ElementList.Methods);
	extend(NodeList.prototype, ElementList.Methods);
	extend(NamedNodeMap.prototype, ElementList.Methods);
	Array.makeIterable(NodeList, NamedNodeMap);
	
})();
