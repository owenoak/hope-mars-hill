//
//	Add methods to all documents
//

// add extension methods to Document
Document.extend = extendPrototype;
Document.extendClass = extendThis;

var documentMethods = {
	create 		: Element.prototype.create,
	select 		: function(selector) {	return document.querySelector(selector)	},
	selectAll 	: function(selector) {	return document.querySelectorAll(selector)	}
};

Document.extend(documentMethods);
extend(window, documentMethods);


