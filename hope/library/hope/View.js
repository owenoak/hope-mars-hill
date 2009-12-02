/*
	A View is a JS object which has an on-screen representation, draw() semantics, etc.
	
	Currently each viewable should point to a single ".element" which is the dom node
	that it manipulates.
	
	Note that you can call Element methods on View and they will be passed down to the elements.


*/

new Class({
	name : "View",
	collection : "Views",


	defaults : {
		id : undefined,				// globally unique id for this control (will be generated if necessary, guaranteed to be unique)
		globalRef : undefined,		// globally unique reference string for this control (will be generated, guaranteed to be unique)

		elements : undefined,		// pointer to our main element(s) after we've been drawn
		childContainer : "",		// pointer to (or local selector for) our child container or "" to indicate our main element
		replaceElements : false,	// if true, when we redraw we replace our elements 

		parent : undefined,			// pointer to our parent control (or view, etc)
		parentElement : undefined,	// pointer to (or global selector of) our parent element
		
		autoDraw : false,			// if true, we draw automatically after being created
		
		// the following properties are generally used in templates to apply styling/etc to our
		//	outer element(s) -- it is up to the templates to include them
		
		className : undefined,		// css class name for outer element (in template, use <<@className>>)
		style : undefined,			// css style properties for outer element (in template, use <<@style>>)
		
		// event handling
		observes : undefined,		// comma-separated list of events that we handle (in template, use <<@events>>)

		movable : false,			// can we be moved around the screen with the mouse?
		// TODO: moveConstraint ?
		resizable : false,			// can we be resized with the mouse?

		draggable : false,			// can we be dragged with the mouse?
		dragType : "",				// type of thing that is being dragged (if dynamic, set in "dragStart()")

		droppable : false,			// can we be dropped on when something else is dragging?
		dropTypes : "*",			// space-separated list of types of things that can be dropped on us
									// "*" means we'll accept anything
		
		
		visible : true,				// if true, the control is visible  (affected by parents)
		enabled : true,				// if true, the control is enabled (affected by parents)
		selectableText : true,		// if true, user can select text in the control (affected by parents)

		redrawDelay : .1,			// delay in SECONDS between last '.redrawSoon()' and the actual '.redraw()'
		
		mainTemplate : undefined,	// id or pointer to our main template object [see expand()]

		//
		//	creation/destruction
		//

		initialize : function initialize(attributes) {
			this.elements = new ElementList();
			this.set(attributes);
			this.makeGloballyAddressable();
			if (this.autoDraw) this.draw();
		},

		destroy : function() {
			this.orphan();
			this.elements.invoke(null, "destroy");
		},


		//
		//	drawing/resizing semantics
		//
	
		draw : function(index) {
			this.beforeDraw();
			this.drawElements(index);
			this.drawChildren();
			this.setupEvents();
			this.afterDraw();
		},
		
		// do any initialization before drawing our elements
		beforeDraw : function() {},
		
		// Actually draw our elements and place them in their parent container.
		//
		// Default implementation expands our mainTemplate.
		//
		// NOTE: this should set .elements to an array of elements (or at least an empty array)
		drawElements : function(index) {
			var outerHtml = this.expand();
			this.elements = outerHtml.toElements();
			if (this.elements.length == 0) return;

			// if we're not visible, hide BEFORE inserting into the page
			if (!this.visible) this.hide();
			
			if (typeof this.parentElement == "string") this.parentElement = document.select(this.parentElement);
			
			if (!this.parentElement) return this._warn(this,".drawElements(): parentElement not defined");
			this.parentElement.addList(this.elements, index);
		},
		
		// Actually draw our children.
		// Default implementation tells each of our children to draw themselves.
		drawChildren : function() {
			if (!this.children) return;
			var container = this.getChildContainer();
			
			this.children.forEach(function(child) {
				if (!child.parentElement) child.parentElement = container;
				child.draw();
			});
		},


		// set up any event handlers
		setupEvents : function() {},
		
		// do any cleanup after drawing our elements
		afterDraw : function() {},



		// call redraw 'in a little while'
		//	use this if a lot of manipulations would call redraw() over and over
		scheduleRedraw : function() {
			this.delay("redraw", this.redrawDelay, "redraw");
		},
		
		// top-level redraw
		redraw : function() {
			this.clearDelay("redraw");
			this.beforeRedraw();
			this.redrawElements();
			this.redrawChildren();
			this.afterRedraw();
		},
		
		
		beforeRedraw : function() {},
		redrawElements : function(){
			if (this.replaceElements) {
				var oldElements = this.elements,
					newElements = this.expand().toElements()
				;
				this.parentElement.replaceList(oldElements, newElements);
				this.elements = newElements;
				
				// call setupEvents again (??? breaks encapsulation slightly to have this here)
				this.setupEvents();
			}
		},
		redrawChildren : function() {
			if (this.children) this.children.invoke("redraw");
		},
		afterRedraw : function() {},
		


		// resize to a specific (outer) width and height
		//	TODO: animation?
		resize : function resize(width, height) {
			this.invoke(selector, "resize", [width, height]);
			return this;
		},
	


		// return the sub-element of this object which should hold our children
		getChildContainer : function() {
			if (this.elements.length == 0) return undefined;
			return this.elements.select(this.childContainer);
		},



		// expand a template
		// called without any arguments, expands our mainTemplate
		expand : function(template) {
			var template = Template.get(template || this.mainTemplate);
			if (!template) return "";
			
			// make sure at least this object is in the array of arguments
			var args = Array.args(arguments, 1);
			if (args.length == 0) args[0] = this;
			
			return template.expand.apply(template, args);
		},


		//
		//	children semantics
		//

		// set our children to an array of children
		setChildren : function(children) {
			this.empty();
			if (children) this.addList(children);
			return this;
		},
		
		// add child to this.children at spot index
		//	if index is undefined, appends to end
		// NOTE: if this parent has been drawn, the child will be implicitly drawn as well
		add : function(child, index) {
			if (child == null) return;
			if (!this.children) this.children = [];

			// remove the child if it was previously in the list of children
// TODO: this was causing an endless loop
//			this.remove(child);

			// add it in the proper place in the list of children
			this.children.add(child, index);

			// remove us from our old parent
			if (child.parent && child.parent != this) {
				child.orphan();
			}
			
			child.parent = this;

			// if we have been drawn
			var container = this.getChildContainer();
			if (container) {
				child.parentElement = container;
				
				// if the child has not been drawn, draw it now
				if (!child.elements) {
					child.draw(index);
				}
				// otherwise add the elements to our container
				else {
					container.addList(child.elements);
				}
			}

			return this;
		},
		
		addList : function(list, index) {
			if (typeof index != "number") index = (this.children ? this.children.length : 0);
			Array.forEach(list, function(it) { this.add(it, index++) }, this);
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
			this.elements.invoke("orphan");
			return this;
		},
		
		
		// replace one child with another
		replace : function(oldChild, newChild) {
			if (!this.children) this.children = [];
			var index = this.children.indexOf(oldChild);
			this.remove(oldChild);
			this.add(newChild, index);
			return this;
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
			this.elements.show();
			return this;
		},

		hide : function hide(selector) {
			if (selector == null && this.visible != false) {
				this.visible = false;
				if (this.children) this.children.invoke("parentHidden");
			}
			this.elements.hide();
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
		isEnabled : function() {
			if (!this.enabled) return false;
			return this.ancestors().all(function(parent) {
				return this.enabled;
			});
		},

		setEnabled : function setEnabled(enable, selector) {
			return (enable == false ? this.disable(selector) : this.enable(selector));
		},
		
		enable : function enable(selector) {
			if (selector == null && this.enabled != true) {
				this.enabled = true;
				this.children && this.children.invoke("onParentEnabled");
			}
			this.elements.enable();
			return this;
		},
		
		disable : function disable(selector) {
			if (selector == null && this.enabled != false) {
				this.enabled = false;
				this.children && this.children.invoke("onParentDisabled");
			}
			this.elements.disable();
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
		//	event handling
		//
		
		// output the attributes that are needed for our event hookup
		//	TODO: have special case for draggable, resizable, droppable, etc
		getEventAttributes : function() {
			var output = "", observes = (this.observes || "").split(" ");
		
			// add special events to the observes list
			if (this.moveable && !observes.contains("move")) observes.push("move");
			if (this.resizable && !observes.contains("resize")) observes.push("resize");
			if (this.draggable && !observes.contains("drag")) observes.push("drag");
			if (this.droppable && !observes.contains("drop")) observes.push("drop");
			
			observes = observes.join(" ");
			if (observes) output = " observes='"+ observes + "'";
			if (this.selectableText == false) output += " selectable='false'";
			output += " target='" + this.globalRef + "'";
			
			return output;
		},
		
		set selectableText(selectable) {
			this.selectableText = (selectable = selectable != false);

			if (selectable) {
				this.elements.removeAttribute("selectable");
			} else {
				this.elements.addAttribute("selectable", "false");
			}
		}

	},
	
	classDefaults : {

	}
});



Debuggable.applyTo(View, "View");
