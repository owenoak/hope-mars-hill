/*
	Element (and Document) extensions
	
	TODO:
		- cumulativeOffset  (containerX/Y?) etc
		- absolutize/relativize

*/

// make Element and elements debuggable
Debuggable.applyTo(Element, "Element");
Debuggable.applyTo(Element.prototype, "element");

// assign "head" tag to document (similar to document.body)
document.head = document.querySelector("HEAD") || document.querySelector("HTML");


// add extension methods to Element and Document
Element.extend = Document.extend = extendPrototype;



// pattern:  set a JS object as our 'target' for event callbacks/manipulation

//
//
//	TOOD:		* .after(), .before()
//				* .insertAfter(), .insertBefore()
//				* .wrap()				- wrap with something else (goes to innermost element)
//				* .replaceWith()
//

var elementMethods = {
	extend : extendThis,		// add methods to this element (or to prototype)

	// return an ElementList of all non-text node children of this element
	get elements() {
		return (new ElementList()).setTo(this.children);
	},

	// getter/setter for inner html of element
	// use html = foo especially because:
	//		1) it will make sure any children are cleaned up
	//		2) it will hook up events for children (?)
	get html() {
		return this.innerHTML;
	},
	
	set html(html) {
		this.destroyChildren();
		this.innerHTML = html;
		this.initializeChildEvents();
	},
	

	//
	//	child/parent manipulation
	//

	// add one or more elements to end of my list of elements
	add : function add() {
		for (var i = 0, len = arguments.length; i < len; i++) {
			if (!arguments[i]) continue;
			this.appendChild(arguments[i]);
		}
		return this;
	},

	// alias of add
	append : function append() {
		for (var i = 0, len = arguments.length; i < len; i++) {
			if (!arguments[i]) continue;
			this.appendChild(arguments[i]);
		}
		return this;
	},

	// add one or more elements to front of my list of elements
	prepend : function prepend() {
		for (var i = arguments.length; i >= 0; i--) {
			if (!arguments[i]) continue;
			if (!this.firstChild) 	this.appendChild(arguments[i]);
			else					this.insertBefore(arguments[i], this.firstChild);
		}
		return this;
	},
	
	// append this element to someone else
	appendTo : function appendTo(newParent) {
		newParent.appendChild(this);
	},
	
	// prepend this element to someone else
	prependTo : function prependTo(newParent) {
		newParent.prepend(this);
	},

	// remove everything from this element
	empty : function empty() {
		this.innerHTML = "";
	},

	// pass in empty to remove us from our parent node
	// pass in an element to remove that element from us
	remove : function remove(element) {
		if (element == null) return this.parentNode.remove(this);
		return this.removeChild(element);
	},
	
	// replace one element with another
	//	NOTE: the syntax is opposite of replaceChild
	replace : function replace(oldElement, newElement) {
		this.replaceChild(newElement, oldElement);
	},

	// clone this node and all children
	clone : function clone(deep) {
		return this.cloneNode(deep!=false);
	},


	//
	//	ancestry
	//
	
	// are we a child of parent
	childOf : function(parent) {},

	// are we an ancestor of child
	ancestorOf : function(child) {},


	//  Return our closest parent.
	//	If selector is not passed, returns our immediate parentNode.
	//	If selector is passed, returns first parent where parent.matches(selector) is truthy.
	//	Selector can be a string (css selector) or function [see element.matches()].
	parent : function(selector) {
		if (!selector) return this.parentNode;
		var parent = this;
		while (parent = parent.parentNode) {
			if (parent instanceof Element && parent.matches(selector)) return parent;
		}
	},

	//  Return an array of our parent elements, with the closest parent as first in the list.
	//	If selector is not passed, returns all parents.
	//	If selector is passed, only returns elements where parent.matches(selector) is truthy.
	//	Selector can be a string (css selector) or function [see element.matches()].
	//
	// 	NOTE: the returned list DOES NOT INCLUDE the document object.
	parents : function parents(selector) {
		var parents = [], parent = this;
		while (parent = parent.parentNode) {
			if (selector) {
				if (parent instanceof Element && parent.matches(selector)) parents.push(parent);
			} else {
				parents.push(parent);
			}
		}
		return parents;
	},


	//	
	//	selecting nodes via CSS selectorss
	//

	// select the first item that matches selector
	//	if selector is an Element, just returns that
	select : function select(selector) {
		if (selector instanceof Element) return selector;
		return this.querySelector(selector);
	},
	
	// returns all items that match selector
	selectAll : function selectAll(selector) {
		return this.querySelectorAll(selector);
	},

	// returns true if this element matches the selector
	//	selector can be:
	//		- a css selector string, or
	//		- or function (which is called with the element as 'this')
	//			which is considered successful if it returns a 'truthy' value
	//			(eg: not null, undefined, 0, false or "")
	//
	// TODO: css selector matching is pretty inefficient here
	matches : function(selector) {
		if (typeof selector == "string") {
			// TODO: this is not very efficient...
			var parent = this.parentNode, 
				matching = parent.selectAll(selector)
			;
			return matching.contains(this);
			
		} else if (typeof selector == "function") {
			return (selector.call(this, this) ? true : false);
		}
		this._warn("matches(",selector,"): typeof selector not understood (", typeof selector, ")");
	},


	//
	//	attribute methods
	//

	

	// add the attributes of this element to object
	//	if object is not passed in, makes an anonymous object
	//	else if object has a generic 'set' method, calls that
	//	returns object
	getAttributes : function(object) {
		if (!object) object = {};
		this.attributes.forEach(function(attr) {
			if (object.set) 	object.set(attr.name, attr.value);
			else				object[attr.name] = attr.value;
		});
		return object;
	},

	// Does the list-like attribute contain a certain value?
	// Delimiter is used to split the attribute value up -- default is " ".
	attributeContains : function(name, value, delimiter) {
		if (!delimiter) delmiter = " ";

		var attrValue = this.getAttribute(name);
		if (!attrValue) return false;
		var list = attrValue.split(delimiter);
		return list.indexOf(value) > -1;
	},

	// Add valueToAdd to the list-like attribute <name>.
	// Delimiter is used to split the attribute value up -- default is " ".
	addToAttribute : function(name, valueToAdd, delimiter) {
		if (!delimiter) delimiter = " ";

		var attrValue = this.getAttribute(name);
		if (!attrValue) {
			newValue = valueToAdd;
		} else {
			var list = attrValue.split(delimiter);
			if (list.indexOf(valueToAdd) > -1) return this;
			list.push(valueToAdd);
			newValue = list.join(delimiter);
		}
		this.setAttribute(name, newValue);
		return this;
	},
	
	// Remove valueToRemove from the list-like attribute <name>.
	// Delimiter is used to split the attribute value up -- default is " ".
	removeFromAttribute : function(name, valueToRemove, delimiter) {
		if (!delimiter) delimiter = " ";
		var attrValue = this.getAttribute(name), newValue;
		if (!attrValue) {
			return this;
		} else {
			var list = attrValue.split(delimiter),
				index = list.indexOf(valueToRemove)
			;
			if (index == -1) return this;
			list.splice(index, 1);
			newValue = list.join(delimiter);
		}
		this.setAttribute(name, newValue);
		return this;
	},
	
	// Toggle the presence of <value> in list-like attribute <name>.
	//	Condition can be:
	//		- undefined : we'll remove <value> if it was present or add it if it was not.
	//		- a function:  executes the function with arguments <name>,<value>
	//		- any other value: we add attribute if value is truthy
	// 	Delimiter is used to split the attribute value up -- default is " ".
	toggleAttribute : function(name, value, condition, delimiter) {
		if (condition === undefined) {
			condition = !this.attributeContains(name, value, delimiter);
		} else if (typeof condition == "function") {
			condition = condition.call(this, name, value);
		}
		
		if (condition) 	return this.addToAttribute(name, value, delimiter);
		else			return this.removeFromAttribute(name, value, delimiter);
	},
	
	//
	// class name manipulation
	//
	hasClass : function(name) {
		return this.attributeContains("class", name);
	},
	
	addClass : function(name) {
		return this.addToAttribute("class", name);
	},
	
	removeClass : function(name) {
		return this.removeFromAttribute("class", name);
	},
	
	// if element had the name, removes it -- otherwise adds it
	//	pass condition of function (called with 'this' as element)
	//		boolean, etc to set explicitly  [ see element.toggleAttribute() ]
	toggleClass : function(name, condition) {
		return this.toggleAttribute("class", name, condition);
	},
	
	
	//
	//	style manipulation
	//


	// return the computed style for this element
	get computedStyle() {
		return window.getComputedStyle(this, null);
	},

	// return the current style for prop (in camelCase form)
	get : function(prop) {
		var style = this.computedStyle;
		if (arguments.length == 1) {
			return style[prop];
		} else {
			var props = {};
			for (var i = 0; i < arguments.length; i++) {
				props[arguments[i]] = style[arguments[i]];
			}
			return props;
		}
	},
	
	// set a bunch of styles either as:
	//		string of  "camelCaseProp:blah;otherProp:blah;"
	//  or  object of  {camelCaseProp:'blah', otherProp:'blah'}
	set : function(styles) {
		if (typeof styles == "string") {
			styles = styles.split(/\s*;\s*/);
			styles.forEach(function(style) {
				if (!style) return;
				style = style.split(/\s*:\s*/);
				this.style[style[0]] = style[1];
			});
		} else {
			for (var key in styles) {
				this.style[key] = styles[key];
			}
		}
		return this;
	},
	
	
	//
	//	visibility		-- TODO: use css class to hide?
	//
	
	get display() {
		return this.get("display");
	},
	
	set display(display) {
		this.style.display = display;
	},

	// TODO: this needs to look at our parents
	isVisible : function() {
		if (this.display == "none") return false;
		return this.parents().every(function(parent) {
			return parent.display != "none";
		});
	},
	
	show : function() {
		// if style.display is actually set, clear it
		if (this.style.display) {
			this.style.display = "";
		} else {
			var showMap = {
				"tr":"table-row", "td":"table-cell"
			}
			this.style.display = showMap[this.hopeType] || "block";
		}
		return this;
	},
	
	hide : function() {
		this.style.display = "none";
		return this;
	},
	
	toggle : function() {
		if (this.isShown()) 	return this.hide();
		else					return this.show();
	},

	
	// duration of an animation by default
	animationDuration : 250,
	
	// number of steps for an animation by default
	animationSteps : 10,
	fade : function(duration, callback, direction) {
		if (!duration) duration = parseInt(this.animationDuration);
		var startOpacity = parseFloat(this._startOpacity 
							|| (this._startOpacity = (this.get("opacity") || 1))
						   );

		var element = this,
			delta = startOpacity / this.animationSteps,
			index = 0
		;
		
		if (direction == "out") {
			var opacity = startOpacity;
			delta = -1 * delta;
			function end()	{	element.style.display = "none"; element.style.opacity = startOpacity;}
		} else {
			var opacity = this.style.opacity = 0
			this.style.display = "";
			function end()	{}
		}

		function step() {
			if (++index > element.animationSteps) {
				clearInterval(interval);
				end();
				if (callback) callback();
			}
			element.style.opacity = (opacity += delta);
		}
		var interval = setInterval(step, duration / this.animationSteps);
	},
	
	fadeIn : function(duration, callback) {
		this.fade(duration, callback, "in");
	},
	
	fadeOut : function(duration, callback) {
		this.fade(duration, callback, "out");
	},


	//
	//	size and position
	//	
	
	// return true if this element is position is one of 'absolute', 'relative' or 'fixed'
	isPositioned : function() {
		var position = this.get('position');
		return (position == 'absolute' || position == 'relative' || position == 'fixed');
	},
	
	
	//  Make the element absolutely positioned at its current place in the document.
	//	If <toPage> is false, element stays within its container.
	//	If <toPage> is true,  element is re-rooted to <body> element.
	absolutize : function (toPage) {
		if (toPage) {
			if (this.get('position') == "absolute" && this.parentNode == document.body) return this;
			var rect = this.rect;
			document.body.add(this);
			
		} else {
			if (this.get('position') == "absolute") return this;
			var rect = this.offsetRect;
		}

		this.style.position = "absolute";
		this.style.left = rect.left + "px";
		this.style.top = rect.top + "px";
		this.style.width = rect.width + "px";
		this.style.height = rect.height + "px";

		return this;
	},
	
		
	// first parent with relative/absolute positioning
	get offsetParent() {
		return this.parent(this.isPositioned);
	},
	// all parents with relative/absolute positioning
	get offsetParents() {
		return this.parents(this.isPositioned);
	},
	
	get offsetRect() {
		return new Rect(this.offsetLeft, this.offsetTop, this.width, this.height);
	},
	
	// return an object with {left, top, right, bottom, width, height} relative to the page 
	get rect() {
		return new Rect(this.left, this.top, this.width, this.height);
	},

	
	// return the left of this element relative to the entire page
	get left() {
		var left = this.offsetLeft;
		this.offsetParents.forEach(function(parent) {
			left += parent.offsetLeft;
		});
		return left;
	},
	
	// return the top of this element relative to the entire page
	get top() {
		var top = this.offsetTop;
		this.offsetParents.forEach(function(parent) {
			top += parent.offsetTop;
		});
		return top;
	},

	// set left/top (relative to offsetParent) -- mainly here so you don't have to add "px" to a number
	set left(left) {
		if (typeof left == "number") left += "px";
		this.style.left = left;
	},
	set top(top) {
		if (typeof left == "number") left += "px";
		this.style.top = top;
	},
	
	
	//
	// get/set outside width/height of the element (including border+padding, not including margin)
	//
	get width() {
		return this.offsetWidth;
	},
	set width(width) {
		if (typeof width == "number") width += "px";
		this.style.width = width;
	},

	get height() {
		return this.offsetHeight;
	},
	set height(height) {
		if (typeof height == "number") height += "px";
		this.style.height = height;
	},
	
	//
	// get/set content width/height -- does NOT include border, padding or margins
	//
	get innerWidth() {
		var width = this.width,
			padding = this.padding,
			borders = this.borders
		;
		return width - (padding.left + padding.right + borders.left + borders.right);
	},
	set innerWidth(width) {
		var padding = this.padding,
			borders = this.borders
		;
		width += (padding.left + padding.right + borders.left + borders.right);
		this.style.width = width + "px";
		return width;
	},

	get innerHeight() {
		var height = this.height,
			padding = this.padding,
			borders = this.borders
		;
		return height - (padding.top + padding.bottom + borders.top + borders.bottom);
	},
	set innerHeight(height) {
		var height = this.height,
			padding = this.padding,
			borders = this.borders
		;
		height += (padding.top + padding.bottom + borders.top + borders.bottom);
		this.style.height = height + "px";
		return height;
	},
	
	
	
	// return the padding for this element as {left, top, right, bottom}
	get padding() {
		var style = this.computedStyle;
		return {
			left : parseFloat(style.paddingLeft),
			top  : parseFloat(style.paddingTop),
			right : parseFloat(style.paddingRight),
			bottom : parseFloat(style.paddingBottom)
		}
	},

	// return the borders for this element as {left, top, right, bottom}
	get borders() {
		var style = this.computedStyle;
		return {
			left : parseFloat(style.borderLeftWidth),
			top  : parseFloat(style.borderTopWidth),
			right : parseFloat(style.borderRightWidth),
			bottom : parseFloat(style.borderBottomWidth)
		}
	},

	// return the margins for this element as {left, top, right, bottom}
	get margins() {
		var style = this.computedStyle;
		return {
			left : parseFloat(style.marginLeft),
			top  : parseFloat(style.marginTop),
			right : parseFloat(style.marginRight),
			bottom : parseFloat(style.marginBottom)
		}
	},
	
	// resize to a specific (outer) width and height
	//	TODO: animation?
	resize : function resize(width, height) {
		if (width != undefined) this.width = width;
		if (height != undefined) this.height = height;
		return this;
	},
	
	// TODO: animation	
	moveTo : function(left, top) {
		if (left != undefined) this.left = left;
		if (top != undefined) this.top = top;
		return this;
	},

	// TODO: animation
	//	TODO: may want to set right & bottom if current width is a percentage...
	setRect : function(rect) {
		this.left = rect.left;
		this.top = rect.top;
		this.width = rect.width;
		this.height = rect.height;
	},

	
	//
	//	scroll
	//

	// TODO: take a speed parameter?
	scrollTo : function(left, top) {
		if (arguments.length == 1 && left.left != undefined || left.top != undefined) {
			top = arguments[0].top;
			left = arguments[0].left;
		}
		this.scrollLeft = left;
		this.scrollTop = top;
	},

	
	//
	//	element creation
	//
	
	// Compact syntax to create an element with specified tag name and extras
	// Attributes are attribute values to assign to the element
	// Special attributes:
	//		parent				- selector for parent to add new node to (eg: "#someId" or "HEAD")
	//		where				- 'where' parameter for parent.add() routine (see 'element.add')
	//		html or innerHTML	- html contents for the new element
	//		
	create : function create(tagName, attributes) {
		// the following tags need to be created in an enclosing tag to work properly
		var enclosedTags = {
				"style":"div",
				"td" : "table",
				"tr" : "table"
			}, 
			enclosingTag = enclosedTags[tagName.toLowerCase()]
		;
	
		var element, 
			html = "", 
			text = "",
			parent, 
			where,
			attrString = []
		;
		
		// if we're not dealing with an enclosing tag, create the element directly
		if (!enclosingTag) {
			element = document.createElement(tagName);
		}
		
		// process attributes
		if (attributes) {
			if (typeof attributes == "string") {
				html = attributes;
				
			} else {
				for (var name in attributes) {
					var value = attributes[name];
					
					switch (name) {
					  case "parent":
						// get the parent as a CSS selector (we'll install it below)
						if (value == "this" || value == "self") parent = this;
						else									parent = this.select(value);
						break;
						
					  case "class":
					  case "className":	if (element) 	element.className = value;
					  					else			attrString.push("class='"+value+"'");
					  					break;
					  
					  case "style":
					  					if (element)	element.setStyles(value);
					  					else			attrString.push("style='"+value+"'");
					  
					  case "html":
					  case "innerHTML":
						html = value;
						break;
						
					  case "text":
					  	text = value;
					  	break;
						
					  default:
						// DEBUG: try...catch to make sure name/value are legal
						if (element)	element.setAttribute(name, value);
										// TODO: quoting?
						else			attrString.push(name + "=\"" + value + "\"");
					}
				}
			}
		}
		
		// if we haven't created the element yet
		//	construct HTML for the inner tag and recusively call create with the enclosing tag
		//	then get the created element
		if (!element) {
			var enclosedHTML = "<"+tagName+" "+attrString.join(" ")+">" + 
						html + text +		// note: not well defined if you pass both text and html
					"</"+tagName+">"
			;
			element = this.create(enclosingTag, enclosedHTML).select(tagName);
		} else {
			if (html) element.innerHTML = html;
			if (text) element.add(document.createTextNode(text));
		}
		
		// append to parent, if specified
		if (parent) parent.appendChild(element);
	
		return element;
	},

	// clean up this and it's children by removing their data cache and clearing event handlers
	// TODO: would be good to have a plugin architecture here?
	destroy : function(destroyChildren) {
		// TODO: clean up event handlers?
		delete ElementDataCache[this.globalId];
		this.stopObservingAll();
		if (this.childNodes.length && destroyChildren) this.destroyChildren();
	},
	
	// clean up the children of this node by removing their data cahe
	destroyChildren : function() {
		this.selectAll("[globalId]").forEach(function(descendant) {
			// NOTE: "false" below tell kids not to destroy *their* kids 
			//			since we're getting all descendants with the select above
			descendant.destroy(false);
		});
	},
	
	
	//
	//	element to JS object
	//

	// return the JS Class name that corresponds to this element (according to its tag name)
	// TODO: rename this
	get hopeType() {
		return (this.localName || "").toLowerCase();
	},

	// get the constructor for the JS Class that corresponds to this element (if defined)
	// TODO: rename this
	get hopeClass() {
		return hope.getClass(this.hopeType);
	},

	// convert this element into a JS object
	//	attempts to instantiate as a class if one is found
	//	otherwise creates an anonymous object
	// if processChildren is true, will recurse for all children
	//
	// TODO: 	- method name???  'type' name???  '_sourceElement' name?
	//			- smarter way of dealing with where to put the children?
	// 			- what do we do with text nodes?
	//			- distinguish between HTML elements and custom elements?
	//				- for HTML elements, treat as text and don't recurse to children?
	toJS : function(skipChildren) {
		var constructor = this.hopeClass,
			object = this.getAttributes()
		;

		if (constructor) {
			object = new constructor(object);
		} else {
			console.warn(this,"toJS(): couldn't find constructor for ",this.hopeType);
			if (!object.type) object.type = this.hopeType;	// TODO: name???
			object._sourceElement = this;
		}
/*
		if (skipChildren != true && this.children) {
			if (object.add) {
				forEach(this.children, function(child) {
					object.add(child.toJS(skipChildren));
				});
			} else {
				object.children = map(this.children, function(child) {
					return child.toJS(skipChildren);
				});
			}
		}
*/		
		return object;
	}
}


// add the elementMethods methods to Element.prototype and Document.prototype
Element.extend(elementMethods);




var documentMethods = {
	create 		: Element.prototype.create,
	select 		: function(selector) {	return document.querySelector(selector)	},
	selectAll 	: function(selector) {	return document.querySelectorAll(selector)	}
};

extend(document, documentMethods);
extend(window, documentMethods);





//	::
//	::	Data Cache
//	::
//		Safe way of attaching non-string data to any element (eg: functions, objects, etc).
//		Note:  element.clearData() will clear the data cache for this element if it is called
//
(function() {
	// NOTE: "this" is the element in question
	function makeDataFor() {
		// move the getter function aside
		delete Element.prototype.data;
		// assign a new data ListMap to this object
		this.data = new ListMap();
		// set an attribute on the element so we know to clear its data object later
		this.setAttribute("hasData","true");
		// restore the getter function
		Element.prototype.__defineGetter__("data", makeDataFor);
		return this.data;
	}
	// set up the getter function initially
	Element.prototype.__defineGetter__("data", makeDataFor);
	
	Element.prototype.clearData = function clearData() {
		delete this.data;
		this.removeAttribute("hasData");
	}

	// clear element data for ALL elements in the document that have it set up
	//	NOTE: will not clear elements which have been removed from the document...
	document.clearElementData = function clearElementData() {
		// clear the data property from all elements with 'hasData=true'
		document.select("[hasData]").invoke("clearData");
	}
})();



//	::
//	::	Event methods
//	::
//
//	TODO:  - call hookupEvents on:
//				- create 
//				- set html
//				- 
//			- special event stuff
//			- call cleanupEvents() on... ?
//			- figure out how a handler says 'don't continue' -- throw something?
//			- figure out bubbling?
//
(function() {

	// registry of standard handlers
	var Handlers = {}
	function getEventHandler(eventName){
		return Handlers[eventName] || 
			   (Handlers[eventName] = function(event){ this.fire(eventName, event) });
	}

	Element.extend({
		// hookup events for this node and all of its descendants
		hookupEvents : function hookupEvents(skipChildren) {
			var eventNames = this.getAttribute("observes");
			if (!eventNames) return;
			// remove the 'observes' flag as an indicator that we're already set up
			this.removeAttribute("observes");
			this.data.observing = [];
	
			eventNames.split(" ").forEach(function(item) {
				item = item.split(":");
				var eventName = item[0],
					methodName = item[1] || "on"+eventName
				;
				this.observe(eventName, methodName);
			}, this);
			if (skipChildren != true) this.hookupChildEvents();
		},
	
		// hookup events for all of our descendants
		hookupChildEvents : function hookupChildEvents() {
			var kids = this.selectAll("[observes]");
			if (!kids || kids.length == 0) return;
			kids.forEach(function(kid) {
				kid.hookupEvents(true);		// true == kids should not recurse
			});
		},
	
		// observe an event
		observe : function observe(eventName, handler, target, args) {
			var data = this.data;
	
			// set up the standard event handler if it hasn't been done already
			if (!data.observing) data.observing = [];
			if (!this.isObserving(eventName)) {
				// hook up the actual event(s)
				var specialHookup = Element.SpecialEvents.observe[eventName];
				if (specialHookup) {
					specialHookup.apply(this, [eventName]);
				} else {
					this.addEventListener(eventName, getEventHandler(eventName), false);
				}

				data.observing.push(eventName);
				this.setAttribute("observing", data.observing.join(" "));
			}

			// store handler+target+args so we can call it later
			data.addTo(eventName, [handler, target, args]);
		},
		
		// observe an event exactly once and then remove it
		observeOnce : function observeOnce(eventName, handler, target, args) {
			function removeHandler() {
				this.stopObserving(eventName, handler, target);
			}
			this.observe(eventName, handler, target, args);
			this.observe(eventName, removeHandler, this);
		},
	
		// stop observing an event
		stopObserving : function stopObserving(eventName, handler) {
			this.data.removeFrom(eventName, function(item) {
				if (item[0] == handler) return true;
			});
		},
		
		// are we observing a particular event?
		isObserving : function(eventName) {
			if (typeof eventName == "string") {
				return this.data.observing.contains(eventName);
			} else if (eventName.some) {
				// otherwise assume it is an array
				//	and return true if we're observing at least one of the events
				return eventName.some(function(eventName) {
					return this.isObserving(eventName);
				}, this);
			}
			return false;
		},
	
		// Return the default target of our events as set in our "eventTarget" attribute.
		//	(This will generally be a Control of some sort.)
		// If no "eventTarget" was specified, defaults to this element itself.
		get eventTarget() {
			if (this.data.eventTarget === undefined) {
				var target = this.getAttribute("eventTarget");
				this.data.eventTarget = (target ? hope.get(target) : null);
			}
			return this.data.eventTarget || this;
		},
		
		// Fire an event.
		// TODO: how to signal stop processing or continue?
		fire : function(eventName, event, fireArgs) {
console.info("firing ",eventName," on ",this);
			var handlerList = this.data[eventName];
			if (!handlerList || handlerList.length == 0) return;	// TODO: how to signal stop processing or continue?
			
			var defaultTarget = this.eventTarget;
			handlerList.forEach(function(item) {
				var handler = item[0],
					target = item[1] || defaultTarget,
					args = Array.combine([event, this], item[2], fireArgs)
				;
				if (typeof handler == "string") {
					if (! (handler = target[handler]) ) return;
				}
				// TODO: how to signal stop processing or continue?
				handler.apply(target, args);
				
			});
		}
	});
	
	
	// Hnadling special, non-standard browser events
	// 	"observer" = function to use to set up event observation
	//	"ignorer"  = function to use to stop observing event
	Element.SpecialEvents = {
		observe : {},
		ignore : {}
	}
	Element.registerEvent = function(eventNames, observer, ignorer) {
		if (typeof eventNames == "string") eventNames = eventNames.split(" ");
		eventNames.forEach(function(eventName) {
			Element.SpecialEvents.observe[eventName] = observer;
			Element.SpecialEvents.ignore[eventName] = ignorer;
		});
	}
	
	
	// TODO: 	- add data stuff to document
	//			- add observe/etc to document
	//		 	- add document.hookupEvents() to document.onload
	document.hookupEvents = Element.prototype.hookupChildEvents;
})();

