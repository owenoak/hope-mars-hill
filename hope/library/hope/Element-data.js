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
		this.setAttribute("data","y");
		// restore the getter function
		Element.prototype.__defineGetter__("data", makeDataFor);
		return this.data;
	}
	// set up the getter function initially
	Element.prototype.__defineGetter__("data", makeDataFor);

	Element.prototype.clearData = function clearData() {
		if (this.data) {
			delete this.data;
			this.removeAttribute("data");
		}
	}

	// clear element data for ALL elements in the document that have it set up
	//	NOTE: will not clear elements which have been removed from the document...
	document.clearElementData = function clearElementData() {
		var elementsWithData = document.selectAll("[data]");
		// clear the data property from all elements with 'data=true'
		elementsWithData.invoke("clearData");
	}
})();

