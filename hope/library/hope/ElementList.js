// ::
// :: ElementList
// :: 
//		List of elements which can be manipulated (and constructed).
//		Note that these methods are also installed on NodeList and NamedNodeMap
//
//	TODO: make sure concat() etc return an ElementList

new Class({
	name : "ElementList",
	Super : Array
});

var ElementListMethods = {
	// return tagNames of this node and all children
	hopeTypes : function() {
		var list = this.selectAll("*").getProperty("hopeType").unique();

		// if this element has a local name, add it to the start of the list list if not already present
		if (this.localName) {
			if (!list.contains(this.hopeType)) list.unshift(this.hopeType);
		}
		return list;
	}


};


// ::
// :: NodeList and NamedNodeMap
// ::

// add ElementList and array iteration methods to NodeList, NamedNodeMap
extend(NodeList.prototype, ElementListMethods);
extend(NamedNodeMap.prototype, ElementListMethods);
Array.makeIteratable(NodeList, NamedNodeMap);
