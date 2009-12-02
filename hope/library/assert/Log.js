/**
	Log class.
	
	TODO: make a spiffy UI.
	
	@class
*/
function Log(props) {
	extend(this, props);
};
extend(Log.prototype, {
	console : true,
	
	length : 0,
	
	/** Add something to the log. */
	_push : function(status, args) {
		this[this.length++] = status;
		this[this.length++] = args;
	},

	/** Clear the assert log. */
	clear : function() {
		for (var i = 0; i < this.length; i++) {
			delete this[i];
		}
		this.length = 0;
	},
	
	/** Log a message. */
	log : function() {
		this._push("log", arguments);
		if (this.console) this._printItem("log", arguments);
		return this;
	},
	
	/** Log a warning. */
	success : function() {
		this._push("success", arguments);
		if (this.console) this._printItem("success", arguments);
		return this;
	},
	
	/** Log a warning. */
	warn : function() {
		this._push("warn", arguments);
		if (this.console) this._printItem("warn", arguments);
		return this;
	},
	
	/** Log an error. */
	error : function() {
		this._push("error", arguments);
		if (this.console) this._printItem("error", arguments);
		return this;
	},
	
	/** Start a (nestable) group. */
	group : function() {
		this._push("group", arguments);
		if (this.console) this._printItem("group", arguments);
		return this;
	},
	
	/** End the last group. */
	groupEnd : function() {
		this._push("groupEnd", arguments);
		if (this.console) this._printItem("groupEnd", arguments);
		return this;
	},
	
	dir : function(it) {
		this._push("dir", it);
		if (this.console) this._printItem("dir", arguments);
	},
	
	/** Print the Assert log. */
	print : function() {
		for (var i = 0; i < this.length; i+=2) {
			var method = this[i],
				msg = this[i+1]
			;
			this._printItem(method, msg);
		}
	},
	
	_printItem : function(method, msg) {
		if (method == "success") method = "info";
		console[method].apply(console, msg);
	}
});


