// ::
// :: String manipulation ::
// ::
extend(String.prototype, {
	contains : function(substring) {
		return (this.indexOf(substring) > -1);
	},

	// use native string.trim if provided
	trim : String.prototype.trim || function() {
		return this.replace(/^\s+/, '').replace(/\s+$/, '');
	},

	capitalize : function() {
		return this.charAt(0).toUpperCase() + this.substr(1);
	},

	normalizeUrl : function() {
		return Loader.normalizeUrl(this);
	},
	
	makeLegalId : function() {
		return this.replace(/[^\w$_]/g, "_")
	},

	makeQuoteSafe : function() {
		return this.replace("'","\\'").replace("\n","\\n");
	},

	makeDoubleQuoteSafe : function() {
		return this.split('"').join('\\"').split("\n").join("\\n");
	},

	makeHTMLSafe : function() {
		return this.split('<').join('&lt;').split(">").join("&gt;");
	},


	isWhitespace : function() {
		return this && this.match(/^\s+$/) != null;
	},


	startsWith : function(substring) {
		return this.indexOf(substring) == 0;
	},

	endsWith : function(substring) {
		var start = this.length - substring.length;
		return start >= 0 && this.lastIndexOf(substring) == start;
	},

	// html manipulation
	toElement : function() {
		return document.create("div", {html:this}).firstChild;
	},

	toElements : function() {
		return document.create("div", {html:this}).elements;
	}
});



// ::
// :: String parsing ::
// ::

String.attributeParser = /([\w-]+)\s*=\s*((['"])([^'"]+)\3|([\w_]+))/g;

extend(String.prototype, {

	// parse an html attribute string into an object
	//	returns null if attribute string is empty
	//
	//	eg:  "a='1' b=2".getAttributes() = {a:'1', b:'2'}
	//
	getAttributes : function(object) {
		if (!object) object = {};
		var anyFound = false;
		this.replace(String.attributeParser,
					function(match, key, skip1, skip2, quotedValue, value) {
						anyFound = true;
						object[key] = quotedValue || value
					});
		return (anyFound ? object : null);
	},

	// convert a tuple string (eg: query params or css style string) to an object
	//	pass true to deserializeValues if your values were escaped or serialized before
	tupelize : function(itemDelim, keyDelim, deserializeValues) {
		if (!itemDelim) itemDelim = "&";
		if (!keyDelim) keyDelim = "=";
		var output = {},
			items = this.split(itemDelim)
		;
		for (var i = 0, len = items.length; i < len; i++) {
			var item = items[i].split(keyDelim);
			if (item.length != 2) continue;

			var key = item[0],
				value = item[1]
			;
			if (deserializeValues && value) {
				value = deserialize(value);
			}
			output[key] = value;
		}
		return output;
	},


	// Chop a string into pieces according to a pair of start and end regular expressions.
	// 	<start> and <end> are RegExps with the "g" flag set.
	//
	//	Returns an array of:
	//		- simple strings that are not between start/end token
	//		- for each start...end match, an object:
	//				{	middle : "...",
	//					start  : <result of start match>,
	//					end    : <result of end match>,
	//					nested : <boolean, true == there is a nested match inside middle>
	//				}
	//	If it can't match a start/end pair, logs error to console and returns undefined
	//
	chop : function(start, end) {
		var results = [], lastEnd = 0, match, endMatch, middle;

		start.lastIndex = end.lastIndex = 0;
		while (match = start.exec(this)) {
			if (lastEnd != match.index) results.push(this.substring(lastEnd, match.index));

			// advance the end past the start
			end.lastIndex = start.lastIndex;
			var nested = false,
				endOfFirstStart = start.lastIndex,
				endOfNestedStart = endOfFirstStart
			;
			while (endMatch = end.exec(this)) {
				middle = this.substring(endOfNestedStart, endMatch.index);
				// if we can't find another instance of start, stop here
				start.lastIndex = 0;
				if (!start.test(middle)) break;
				// otherwise notice that we're dealing with a nested tag and keep going
				nested = true;
				endOfNestedStart = endMatch.index
			}
			if (!endMatch) return console.error("chopOnExpressions(): can't match ",start," in string '",this,"'");
			results.push( {
							start  		: match,
							middle 		: this.substring(endOfFirstStart, endMatch.index),
							end    		: endMatch,
							nested 		: nested,
							startIndex	: match.index,
							endIndex	: endMatch.index + endMatch[0].length,
							source		: this
						 });
			lastEnd = start.lastIndex = end.lastIndex;
		}
		if (lastEnd != this.length) results.push(this.substr(lastEnd));

		// note the entire string the chop came from
		results.source = this;

		return results;
	},


	//
	//	Parse tags from HTML
	//


	chopOnTag : function(tagName) {
		var startTagParser = new RegExp("\\s*<\\s*("+tagName+")\\s*([^>]*?)\\s*>\\s*","ig"),
			endTagParser = new RegExp("\\s*<\\s*\\/\\s*("+tagName+")\\s*>\\s*","ig")
		;
		return this.chop(startTagParser, endTagParser);
	},

	// Execute a callback for each <tagName> tag in the string
	//	Callback arguments for each tag are:
	//		callback(<tagName>, <attributesString>, <tagContents>)
	//
	//	e.g. to find all <h1>-<h6> tags in document order, do this:
	//		document.body.innerHTML.forEachTag("h\\d",
	//			function(tagName, attrs, contents) { console.warn(tagName+":"+contents)}
	//		);
	//
	forEachTag : function(tagName, callback, thisObject) {
		var chopped = this.chopOnTag(tagName), results = [];
		chopped.forEach(function(chop) {
			// skip everything that is not the tag in question
			if (typeof chop == "string") return;
			results.push(callback.call(thisObject, chop.start[1], chop.start[2], chop.middle));
		});
		return results;
	}
});

