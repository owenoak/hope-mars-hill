/* 
	XMLClass
		- Classes that can bind themselves to an XML object.
		- Each class has a public API of properties that can be loaded from XML attributes.
		- Instances are creted either with a JS object or an XML element.
		- If instantiated with an element, as attributes of the object are changed
			we update the XML object so that we can save it later.

	How are we approaching this?
		- EITHER:  	we are starting with an XML object representation
			OR		we are starting with JS objects which have already been new()d
			
		- ALSO		for cleanliness of layout in the XML files and for re-use
					want to be able to have references to child xml trees defined elsewhere
						(? is the juice worth the squeeze here? makes things more complicated)

		- ALSO		to embed HTML, have an <html> object ???

		- ALSO		with XML object, some sub-objects may be 'properties' of the class instance
					rather than 'children' -- how to distinguish these?
					
					e.g.:  "files" object, which is an array of files which may
							need to be loaded to fully instantiate this object
							
		- strategy:
					If a node has no attributes but has child elements, make that an array


	TODO:  	- name?
			- if <html> child, that is text content to go in "html" element
			- loading scripts/stylesheets automatically
				- need way to attach stuff to element after load and also call initialize?
			- 
	
*/
new Class({
	name : "XMLClass",
	
	defaults : {
		initialize : function(source) {
			// initialize the children array
			//	TODO: only do this for 'container' classes?
			this.children = [];
			
			if (source instanceof Element) 	this.initializeFromElement(source);
			else							this.initializeFromObject(source);
			
			if (this.children.length) this.initializeChildren();
		},
		
		// initialize this instance from an XML element
		initializeFromElement : function(element) {
			// first process a "methods" element to install methods (eg: setters)
			//	before calling getAttributes() below
			var methods = element.select("methods");
			if (methods && methods.parentNode == element) this.extend(methods);

			// add attributes of the element to this instance
			//	this will call setters
			element.getAttributes(this);
			if (element.childNodes.length) {
				var children = this.childrenToJS(element.childNodes);
				if (children.length) this.setChildren(children);
			}

			// now assign the element to us as 'sourceElement' for later manipulation
			this._sourceElement = element;
		},
		
		// override extend to take a <methods> element or a string
		extend : function extend(methods) {
			var object = methods;

			if (methods instanceof Element) {
				var url = methods.getAttribute("url");
				if (url) {
					object = Loader.loadText(Loader.absoluteUrl(url));
				} else {
					object = methods.textContent;
				}
			}
			
			if (typeof object == "string") {
				try {
					var evald = eval("object = "+object);
					object = evald;
				} catch (e) {
					console.error(this, "extend(): Couldn't understand methods of ",methods,"\n",object);
					console.error(e);
				}
			}
			this.asClass(object);
		},
		
		// given a list of children
		//	return a list of JS-ified objects that they correspond to
		//
		//	TODO:
		//			- if you see an "html" element, all children are HTML content, don't create elements
		//			? is pattern of creating arrays valid?
		//
		childrenToJS : function(childNodes) {
			var children = [];
			childNodes.forEach(function(child) {
				if (child instanceof Text) {
					var string = child.data;
					if (string.isWhitespace()) return;
					
					if (this.value == null) {
						this.value = string.trim();
					} else if (typeof this.value == "string") {
						this.value += " " + string;
					} else {
						console.info(this, "childrenToJS(): can't add non-text value '"+string+"' to "+this.value);
					}
				
				} else if (child instanceof Element) {
					var type = child.hopeType,
						constructor = child.hopeClass
					;


					// skip if a JS "methods" declarations (they are handled above)
					if (type == "methods") {
						return;
					
					// if :
					//		1) we couldn't find a constructor
					//		2) there are no attributes to the element, and
					//		3) the child has children
					//	assume that it is an array to be installed in this object under the child.type
					} else if (constructor == null && child.attributes.length == 0 && child.children.length > 0) {
						var collection = this.childrenToJS(child.childNodes);
		
						// add it to this object under the hopeType
						this.set(child.hopeType, collection);
		
					// otherwise if we couldn't find a constructor
					//	throw a warning
					//	TODO ???
					} else if (constructor == null) {
						console.warn(this,"childrenToJS(",child,"): couldn't find constructor for tag: "+child);
		
					// otherwise assume that it is a child to be added to this.children
					} else {
						children.push(new constructor(child));
					
					}				
				}

			}, this);
			return children;
		},
		
		initializeChildren : function() {},
		
		setChildren : function(children) {
// TODO: do something smarter here
			this.children.setToList(children);
		},
		
		// initialize this instance from a JS object
		// NOTE: that we assume that all of the creation of child nodes in the proper classes, etc
		//			that is done in initializeFromElement() has already been done
		initializeFromObject : function(object) {
			// add attributes of the element to this instance
			this.set(object);
		}
	}
});
