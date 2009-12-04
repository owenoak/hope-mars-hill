/*
	Element (and Document) extensions

	TODO:
		- cumulativeOffset  (containerX/Y?) etc
		- absolutize/relativize

*/

// make Element and elements debuggable
Debuggable.mixinTo(Element, "Element");
Debuggable.mixinTo(Element.prototype, "element");

// assign "head" tag to document (similar to document.body)
document.head = document.querySelector("HEAD") || document.querySelector("HTML");


// add extension methods to Element
Element.extend = extendPrototype;
Element.extendClass = extendThis;


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
	
	
	//
	//	html manipulation
	//

	// getter/setter for inner html of element
	// use html = foo especially because:
	//		1) it will make sure any children are cleaned up
	//		2) it will hook up events for children (?)
	html : function(html) {
		if (html != null) {
			this.destroyChildren();
			this.innerHTML = html;
			this.hookupChildEvents();
		}
		return this.innerHTML;
	},


	//
	//	child/parent manipulation
	//

	// add the element to a specific spot in my list of elements (before later children)
	//	if index is undefined, appends to end
	add : function add(element, index) {
		if (typeof index != "number" || index >= this.children.length) {
			index = this.children.length;
		}
		var nthChild = this.elements[index];
		if (nthChild) {
			this.insertBefore(element, nthChild);
		} else {
			this.appendChild(element);
		}
		return this;
	},

	// add a list of children to us
	addList : function(list, index) {
		if (!list || !list.length) return;
		if (index == null) index = this.elements.length;
		Array.forEach(list, function(element) {
			this.add(element, index++);
		}, this);
		return this;
	},
	
	// add this element as a child of parent
	addTo : function(parent, index) {
		parent.add(child, index);
		return this;
	},

	// add the element to the end of my list of elements
	// goes through 'add' for consistency
	append : function append(element) {
		this.add(element);
		return this;
	},

	// add one or more elements to front of my list of elements
	//	goes through 'add' for consistency
	prepend : function prepend(element) {
		this.add(element, 0);
		return this;
	},

	// append this element to someone else
	appendTo : function appendTo(parent) {
		parent.append(this);
		return this;
	},

	// prepend this element to someone else
	prependTo : function prependTo(parent) {
		parent.prepend(this);
		return this;
	},

	// remove everything from this element
	empty : function empty() {
		this.html("");
	},

	// remove an element from us
	remove : function remove(element) {
		this.removeChild(element);
		return this;
	},

	// remove us from our parent node
	orphan : function remove() {
		this.parentNode.remove(this);
		return this;
	},

	// replace one element with another
	//	NOTE: the syntax is opposite of replaceChild
	replace : function replace(oldElement, newElement) {
		this.replaceChild(newElement, oldElement);
		return this;
	},
	
	// remove old elements and put newElements in at more-or-less the same place
	replaceList : function(oldElements, newElements) {
		var index = (oldElements && oldElements.length > 0 ? this.indexOf(oldElements[0]) : -1);
		if (index == -1) index = this.children.length;
		
		if (oldElements) {
			oldElements.forEach(function(element) { 
					this.remove(oldElement)
				}, this);
		}
		if (newElements) this.addList(newElements, index);
		return this;
	},

	// clone this node and all children
	clone : function clone(deep) {
		return this.cloneNode(deep!=false);
	},


	//
	//	ancestry
	//

	get parent() {
		return this.parentNode;
	},

	//  Return our closest parent where selector matches
	//	If selector is not passed, returns our immediate parentNode.
	//	If selector is passed, returns first parent where parent.matches(selector) is truthy.
	//	Selector can be a string (css selector) or function [see element.matches()].
	selectParent : function(selector) {
		if (!selector) return this.parentNode;
		var parent = this;
		while (parent = parent.parentNode) {
			if (parent instanceof Element && parent.matches(selector)) return parent;
		}
	},

	//  Return an array of our parent elements, with the closest parent as first in the list.
	//	If selector is not passed, returns all ancestors.
	//	If selector is passed, only returns elements where parent.matches(selector) is truthy.
	//	Selector can be a string (css selector) or function [see element.matches()].
	//
	// 	NOTE: the returned list DOES NOT INCLUDE the document object.
	ancestors : function ancestors(selector) {
		var ancestors = [], parent = this;
		while (parent = parent.parentNode) {
			if (selector) {
				if (parent instanceof Element && parent.matches(selector)) ancestors.push(parent);
			} else {
				ancestors.push(parent);
			}
		}
		return ancestors;
	},

	// are we an immediate child of parent?
	isChildOf : function(parent) {
		return (this.parentNode == parent);
	},

	// are we a descendant of ancestor?
	isDescendantOf : function(ancestor) {
		var parent = this;
		while (parent = parent.parentNode) {
			if (parent == ancestor) return true;
		}
		return false;
	},

	// are we an ancestor of child?
	isAncestorOf : function(child) {
		return child.descendantOf(this);
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
	// todo: prop as an array?  props as a commaized string?
	getStyle : function(prop) {
		var style = this.computedStyle;
		if (arguments.length == 1 && typeof prop == "string") {
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
	setStyle : function(styles) {
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

	// return true if we are visible (eg: us and our ancestors are all not display:none)
	isVisible : function() {
		if (this.display == "none") return false;
		return this.ancestors().all(function(parent) {
			return parent.display != "none";
		});
	},
	
	setVisible : function(visible) {
		return (visible == false ? this.hide() : this.show());
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

	//
	//	enable/disable semantics
	//
	
	setEnabled : function(enable) {
		if (enable == false) 	return this.disable();
		return this.enable();
	},
	
	enable : function enable() {
		this.removeAttribute("disabled");
		return this;
	},
	
	disable : function disable() {
		this.setAttribute("disabled", "true");
		return this;
	},
	

	//
	//	size and position
	//

	// return true if this element is position is one of 'absolute', 'relative' or 'fixed'
	isPositioned : function() {
		var position = this.getStyle('position');
		return (position == 'absolute' || position == 'relative' || position == 'fixed');
	},


	//  Make the element absolutely positioned at its current place in the document.
	//	If <toPage> is false, element stays within its container.
	//	If <toPage> is true,  element is re-rooted to <body> element.
	absolutize : function (toPage) {
		if (toPage) {
			if (this.getStyle('position') == "absolute" && this.parentNode == document.body) return this;
			var rect = this.rect;
			document.body.add(this);

		} else {
			if (this.getStyle('position') == "absolute") return this;
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
	offsetParent : function() {
		return this.selectParent(this.isPositioned);
	},
	
	// all ancestors with relative/absolute positioning
	offsetParents : function() {
		return this.ancestors(this.isPositioned);
	},

	offsetRect : function() {
		return new Rect(this.offsetLeft, this.offsetTop, this.width(), this.height());
	},

	// return an object with {left, top, right, bottom, width, height} relative to the page
	rect : function() {
		return new Rect(this.pageLeft(), this.pageTop(), this.width(), this.height());
	},


	// get/set the left of this element relative to the offset parent
	left : function(left) {
		if (left != null) {
			if (typeof left == "number") left += "px";
			this.style.left = left;
		}

		return this.offsetLeft;		
	},
	
	// get the left of this element relative to the entire page
	pageLeft : function() {
		var left = this.offsetLeft;
		this.offsetParents().forEach(function(parent) {
			left += parent.offsetLeft;
		});
		return left;
	},

	// get/set the top of this element relative to the offset parent
	top : function(top) {
		if (top != null) {
			if (typeof top == "number") top += "px";
			this.style.top = top;
		}
		return this.offsetTop;
	},

	// return the top of this element relative to the entire page
	pageTop : function() {
		var top = this.offsetTop;
		this.offsetParents().forEach(function(parent) {
			top += parent.offsetTop;
		});
		return top;
	},

	//
	// get/set outside width/height of the element (including border+padding, not including margin)
	//
	width : function(width) {
		if (width != null) {
			if (typeof width == "number") width += "px";
			this.style.width = width;
		}
		return this.offsetWidth;
	},

	height : function(height) {
		if (height != null) {
			if (typeof height == "number") height += "px";
			this.style.height = height;
		}
		return this.offsetHeight;
	},

	//
	// get/set content width/height -- does NOT include border, padding or margins
	//
	innerWidth : function(width) {
		var padding = this.padding(), borders = this.borders();
		
		if (width != null) {
			width += (padding.left + padding.right + borders.left + borders.right);
			this.style.width = width + "px";
		}
		
		return this.offsetWidth - (padding.left + padding.right + borders.left + borders.right);
	},

	innerHeight : function(height) {
		var padding = this.padding(), borders = this.borders();

		if (height != null) {
			height += (padding.top + padding.bottom + borders.top + borders.bottom);
			this.style.height = height + "px";
			return height;
		} 

		return this.offsetHeight - (padding.top + padding.bottom + borders.top + borders.bottom);
	},



	// return the padding for this element as {left, top, right, bottom}
	padding : function() {
		var style = this.computedStyle;
		return {
			left : parseFloat(style.paddingLeft),
			top  : parseFloat(style.paddingTop),
			right : parseFloat(style.paddingRight),
			bottom : parseFloat(style.paddingBottom)
		}
	},

	// return the borders for this element as {left, top, right, bottom}
	borders : function() {
		var style = this.computedStyle;
		return {
			left : parseFloat(style.borderLeftWidth),
			top  : parseFloat(style.borderTopWidth),
			right : parseFloat(style.borderRightWidth),
			bottom : parseFloat(style.borderBottomWidth)
		}
	},

	// return the margins for this element as {left, top, right, bottom}
	margins : function() {
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
		if (width != null) this.width(width);
		if (height != null) this.height(height);
		return this;
	},

	// TODO: animation
	moveTo : function(left, top) {
		if (left != null) this.left(left);
		if (top != null) this.top(top);
		return this;
	},

	// TODO: animation
	//	TODO: may want to set right & bottom if current width is a percentage...
	setRect : function(rect) {
		this.left(rect.left);
		this.top(rect.top);
		this.width(rect.width);
		this.height(rect.height);
	},


	//
	//	scroll
	//

	// TODO: take a speed parameter?
	scrollTo : function(left, top) {
		if (arguments.length == 1 && left.left != null || left.top != null) {
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
						else if (value instanceof Element)		parent = value;
						else if (typeof value == "string")		parent = this.select(value);
						else console.warn(".create(",tagName,",",attributes,"): Couldn't understand parent ",value);
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
			if (html) element.html(html);
			if (text) element.add(document.createTextNode(text));
		}

		// append to parent, if specified
		if (parent) parent.appendChild(element);

		return element;
	},

	// clean up this and it's children by removing their data cache and clearing event handlers
	// TODO: would be good to have a plugin architecture here?
	destroy : function(destroyChildren) {
		this.clearData();
		if (this.childNodes.length && destroyChildren != false) this.destroyChildren();
	},

	// clean up the children of this node by removing their data cahe
	destroyChildren : function() {
		this.elements.invoke("destroy");
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
		return Class.getClass(this.hopeType);
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
				Array.forEach(this.children, function(child) {
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


