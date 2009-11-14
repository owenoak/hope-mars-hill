//	::
//	::	Generic Math routines
//	::

extend(Math, {

	// inset one rect via another rect
	// <results> defaults to a new object, pass <rect> to inset the original rect
	inset : function(rect, otherRect, results) {
		var left	= rect.left + otherRect.left,
			top		= rect.top + otherRect.top,
			right 	= rect.right - otherRect.right,
			bottom 	= rect.bottom - otherRect.bottom
		;
		if (!results) results = {};
		results.left = left;
		results.top = top;
		results.right = right;
		results.bottom = bottom;
		results.width = right - left;
		results.height = bottom - top;
		
		return results;
	}
	
});


function Rect(left, top, width, height) {
	this.left = left;
	this.top = top;
	this.width = width;
	this.height = height;
	this.right = left + width;
	this.bottom = top + height;
}
Rect.prototype = {
	// inset this rect
	inset : function(otherRect) {
		return Math.inset(this, otherRect, this);
	}
}