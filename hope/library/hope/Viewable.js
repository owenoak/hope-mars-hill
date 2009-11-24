/*
	A Viewable is a JS object which has an on-screen representation, draw() semantics, etc.
	
	Currently each viewable should point to a single ".element" which is the dom node
	that it manipulates.
	
	Note that you can call Element methods on Viewable and they will be passed down to the elements.


*/

new Class({
	name : "Viewable",
	collection : "Viewables",


	defaults : {
		globalId : undefined,		// globally unique id for this control (will be generated, guaranteed to be unique)
		globalRef : undefined,		// globally unique reference string for this control (will be generated, guaranteed to be unique)

		elements : undefined,		// pointer to our main element(s) after we've been drawn
		childContainer : "",		// pointer to (or local selector for) our child container or "" to indicate our main element

		parent : undefined,			// pointer to our parent control (or view, etc)
		parentElement : undefined,	// pointer to (or global selector of) our parent element
		
		autoDraw : false,			// if true, we draw automatically after being created
		className : undefined,		// css class name for outer element
		style : undefined,			// css style properties for outer element
		
		selectable : true,			// if true, user can select text in the control (affected by parents)
		visible : true,				// if true, the control is visible  (affected by parents)
		enabled : true,				// if true, the control is enabled (affected by parents)


		initialize : function initialize(attributes) {
			this.set(attributes);
			this.makeGloballyAddressable();
			if (this.autoDraw) this.draw();
		},


		//
		//	drawing/resizing semantics
		//


		// return the sub-element of this object which should hold our children
		getChildContainer : function() {
			var container = this.childContainer;
			
			if (container instanceof Element) {
				return container;
			
			} else if (typeof container == "string") {
				// "" means the main element
				if (container == "") return (this.elements ? this.elements[0] : undefined);
				// if we have an element, assume container is a selector for our children
				if (this.element) return this.select(container);
				
			} else {
				this._warn(".getChildContainer(): childContainer of '",container,"' not understood");
			}
		},



		//
		//	children semantics
		//

		// set our children to an array of children
		setChildren : function(children) {
			this.empty();
			children.forEach(function(child) {
				this.add(child);
			}, this);
		},
		
		// add child to this.children at spot index
		//	if index is undefined, appends to end
		// NOTE: if this parent has been drawn, the child will be implicitly drawn as well
		add : function(child, index) {
			if (!this.children) this.children = [];
			
			// remove the child if it was previously in the list of children
			this.remove(child);

			// add it in the proper place in the list of children
			this.children.add(child, index);

			// remove us from our old parent
			if (child.parent && child.parent != this) {
				child.orphan();
			}
			
			child.parent = this;
			var container = this.getChildContainer();
			if (container) {
				child.parentElement = container;
				if (!child.element) child.draw();
				if (child.element) {
					container.add(child.element, index);
				}
			}

			return this;
		},
		
		// add child to the end of our list of children
		append : function(child) {
			return this.add(child);
		},
		
		// add child to the front of our list of children
		prepend : function(child) {
			return this.add(child, 0);
		},
		
		// append this node to another node
		appendTo : function(parent) {
			parent.append(this);
		},

		// prepend this node to another node
		prependTo : function(parent) {
			parent.prepend(this);
		},
		
		// empty out our list of children
		empty : function empty() {
			if (this.children) this.children.invoke("orphan");
			return this;
		},

		// remove the child from us
		remove : function(child) {
			if (this.children) this.children.remove(child);
			if (child.parent == this) child.orphan();
			return this;
		},
		
		// remove us from our current parent
		orphan : function() {
			if (this.parent && this.parent.children) this.parent.children.remove(this);
			if (this.element) this.element.orphan();
			return this;
		},
		
		
		// replace one child with another
		replace : function(oldChild, newChild) {
			if (!this.children) this.children = [];
			var index = this.children.indexOf(oldChild);
			this.remove(oldChild);
			this.add(newChild, index);
		},


		
		//
		//	ancestry
		//

		
		// return the first parent where selector function is truthy
		selectParent : function(selector) {
			var parent = this;
			while (parent == parent.parent) {
				if (selector == null || (parent.matches && parent.matches(selector))) {
					return parent;
				}
			}
		},

		// optional selector is a function -- ancestors for which selector is not truthy will not be returned
		ancestors : function(selector) {
			var ancestors = [], parent = this;
			while (parent == parent.parent) {
				if (selector == null || (parent.matches && parent.matches(selector))) {
					ancestors.push(parent);
				}
			}
			return ancestors;
		},

		// are we an immediate child of parent?
		isChildOf : function(parent) {
			return (this.parent == parent);
		},
	
		// are we a descendant of ancestor?
		isDescendantOf : function(ancestor) {
			var parent = this;
			while (parent = parent.parent) {
				if (parent == ancestor) return true;
			}
			return false;
		},
	
		// are we an ancestor of child?
		isAncestorOf : function(child) {
			return child.descendantOf(this);
		},
		

		//
		// selector semantics -- get sub-element pieces
		//
		select : function(selector) {
			if (this.element) return this.element.select(selector);
		},
		
		selectAll : function(selector) {
			if (this.element) return this.element.selectAll(selector);
			return [];
		},
		
		// invoke a named method for all sub-elements which match "selector"
		// if no elements matched selector, returns undefined
		// if exactly one element matches selector, returns result of that call
		// otherwise returns array of results of call to each matched element
		invoke : function(selector, methodName, args) {
			var elements = this.selectAll(selector);
			if (!elements.length) return;
			var results = elements.invoke(methodName, args);
			if (elements.length == 1) return results[0];
			return results;
		},
		
		
		// return true if this item matches the selector
		//  Currently selector is a function (called with the control as "this" and as first argument)
		//	Eventually selector may be something like a CSS selector for selecting controls
		matches : function(selector) {
			if (!selector) return true;
			return !!(selector.call(this, this));
		},
		
		
		//
		//	attribute methods
		//
		//		- these all work on our main element by default
		//		- pass a selector to have them act on sub-elements that match the selector if desired
		//
		
		// return true if ALL elements matching selector have the specified attribute
		hasAttribute : function(name, selector) {
			if (!selector) return (this.element != null && this.element.hasAttribute(name));
			return (this.invoke(selector, "hasAttribute", [name]) || false).all();
		},
		
		// set the attribute "name" to "value" for all matching elements
		setAttribute : function(name, value, selector) {
			if (!selector) {
				if (this.element) this.element.setAttribute(name, value)
			} else {
				this.invoke(selector, "setAttribute", [name, value]);
			}
			return this;
		},

		removeAttribute : function(name, selector) {
			if (!selector) return (this.element && this.element.removeAttribute(name));
			return this.invoke(selector, "removeAttribute", [name]);
		},
		
		// add the attributes of this element to object for all matching elements
		//	returns list of attribute object
		getAttributes : function(selector) {
			if (!selector) return (this.element && this.element.getAttributes());
			return this.invoke(selector, "getAttributes");
		},
	
		// Does the list-like attribute contain a certain value?
		// Delimiter is used to split the attribute value up -- default is " ".
		attributeContains : function(name, value, delimiter, selector) {
			if (!selector) return (this.element != null && this.element.attributeContains(name, value, delimiter));
			return (this.invoke(selector, "attributeContains", [name, value, delimiter]) || false).all();
		},
	
		// Add valueToAdd to the list-like attribute <name>.
		// Delimiter is used to split the attribute value up -- default is " ".
		addToAttribute : function(name, valueToAdd, delimiter, selector) {
			if (!selector) {
				if (this.element) this.element.addToAttribute(name, valueToAdd, delimiter);
			} else {
				this.invoke(selector, "addToAttribute", [name, valueToAdd, delimiter]);
			}
			return this;
		},
	
		// Remove valueToRemove from the list-like attribute <name>.
		// Delimiter is used to split the attribute value up -- default is " ".
		removeFromAttribute : function(name, valueToRemove, delimiter, selector) {
			if (!selector) {
				if (this.element) this.element.removeFromAttribute(name, valueToRemove, delimiter);
			} else {
				this.invoke(selector, "removeFromAttribute", [name, valueToRemove, delimiter]);
			}
			return this;
		},
	
		// Toggle the presence of <value> in list-like attribute <name>.
		//	Condition can be:
		//		- undefined : we'll remove <value> if it was present or add it if it was not.
		//		- a function:  executes the function with arguments <name>,<value>
		//		- any other value: we add attribute if value is truthy
		// 	Delimiter is used to split the attribute value up -- default is " ".
		toggleAttribute : function(name, value, condition, delimiter, selector) {
			if (!selector) {
				if (this.element) this.element.toggleAttribute(name, value, condition, delimiter);
			} else {
				this.invoke(selector, "toggleAttribute", [name, value, condition, delimiter]);
			}
			return this;
		},
	
		//
		// class name manipulation
		//
		hasClass : function(name, selector) {
			if (!selector) return (this.element != null && this.element.hasClass(name));
			return (this.invoke(selector, "hasClass", [name]) || false).all();
		},
	
		addClass : function(name, selector) {
			if (!selector) {
				if (this.element) this.element.addClass(name);
			} else {
				this.invoke(selector, "addClass", [name]);
			}
			return this;
		},
	
		removeClass : function(name, selector) {
			if (!selector) {
				if (this.element) this.element.removeClass(name);
			} else {
				this.invoke(selector, "removeClass", [name]);
			}
			return this;
		},
	
		// if element had the name, removes it -- otherwise adds it
		//	pass condition of function (called with 'this' as element)
		//		boolean, etc to set explicitly  [ see element.toggleAttribute() ]
		toggleClass : function(name, condition, selector) {
			if (!selector) {
				if (this.element) this.element.toggleClass(name);
			} else {
				this.invoke(selector, "toggleClass", [name]);
			}
			return this;
		},
	
	
	
		// return the current style for prop (in camelCase form)
		get : function(prop, selector) {
			if (!selector) return (this.element && this.element.get(prop));
			return this.invoke(selector, "get", [prop]);
		},
		
		// set a bunch of styles either as:
		//		string of  "camelCaseProp:blah;otherProp:blah;"
		//  or  object of  {camelCaseProp:'blah', otherProp:'blah'}
		set : function(styles, selector) {
			if (!selector) {
				if (this.element) this.element.set(style);
			} else {
				this.invoke(selector, "set", [style]);
			}
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
			if (selector == null && this.visible != true) {
				this.visible = true;
				if (this.children) this.children.invoke("parentShown");
			}
			var elements = (selector ? this.selectAll(selector) : [this.element]);
			elements.invoke("show");
			return this;
		},

		hide : function hide(selector) {
			if (selector == null && this.visible != false) {
				this.visible = false;
				if (this.children) this.children.invoke("parentHidden");
			}
			var elements = (selector ? this.selectAll(selector) : [this.element]);
			elements.invoke("hide");
			return this;
		},
		
		// called by our parent when they are shown
		onParentShown : function() {
			if (this.visible == false && this._wasVisible == true) {
				this.show();
				delete this._wasVisible;
			}
		},
		
		// called by our parent when they are hidden
		onParentHidden : function() {
			if (this._wasVisible === undefined) this._wasVisible = this.visible;
			this.hide();
		},



		//	
		//	enable/disable semantics
		//
		setEnabled : function setEnabled(enable, selector) {
			return (enable == false ? this.disable(selector) : this.enable(selector));
		},
		
		enable : function enable(selector) {
			if (selector == null && this.enabled != true) {
				this.enabled = true;
				this.children && this.children.invoke("onParentEnabled");
			}
			var elements = (selector ? this.selectAll(selector) : [this.element]);
			elements.invoke("enable");
			return this;
		},
		
		disable : function disable(selector) {
			if (selector == null && this.enabled != false) {
				this.enabled = false;
				if (this.element) this.element.disable();
				this.children && this.children.invoke("onParentDisabled");
			}
			var elements = (selector ? this.selectAll(selector) : [this.element]);
			elements.invoke("disable");
			return this;
		},
		
		// called by our parent when they are enabled
		onParentEnabled : function() {
			if (this.enabled == false && this._wasEnabled == true) {
				this.enable();
				delete this._wasEnabled;
			}
		},
		
		// called by our parent when they are disabled
		onParentDisabled : function() {
			if (this._wasEnabled === undefined) this._wasEnabled = this.enabled;
			this.disable();
		},

		
		//
		// size and position
		//
	
		// return true if the element(s)' position is one of 'absolute', 'relative' or 'fixed'
		isPositioned : function(selector) {
			if (!selector) return (this.element != null && this.element.isPositioned());
			return (this.invoke(selector, "isPositioned") || false).all();
		},
	
		//  Make the element absolutely positioned at its current place in the document.
		//	If <toPage> is false, element stays within its container.
		//	If <toPage> is true,  element is re-rooted to <body> element.
		absolutize : function(toPage, selector) {
			if (!selector) {
				if (this.element) this.element.absolutize(toPage);
			} else {
				this.invoke(selector, "absolutize", [toPage]);
			}
			return this;
		}

	},
	
	classDefaults : {

	}
});



Debuggable.applyTo(Viewable, "Viewable");
