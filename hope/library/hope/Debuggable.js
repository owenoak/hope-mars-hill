// ::
// ::	Debug object and Debuggable mixin
// ::
//
//		- Debuggable.applyTo(object, topic)   				to set up _debug(), _warn() and _error() methods
//		- Debug.set(topic, ["debug","warn","error","off"])  to turn on debugging for a topic
//		- Debug.show(topic)    								to see debug log for a topic
//		- Debug.clear(topic)   								to clear debug messages for a topic
//
//	TODO:	- have some sort of group concept?
//
(function() {

	// constants
	var OFF = 0
		ERROR = 1,
		WARN = 2,
		DEBUG = 3,
		
		ERROR_STRING = "!!",
		WARN_STRING = ">>",
		DEBUG_STRING = "  "
	;
		
	window.Debug = {
		stringizeTarget : false,		// if true, we make targe a string in debug messages
		logs : {},						// map of topic -> log message
		levels : {},					// map of topic -> log level
		
		// if true, we log debug messages even if topic is not in debug mode
		logAllDebugs : (Loader.getCookie("debug-logAllDebugs") == "true"),

		set : function(topic, level) {
			switch (level) {
				case "debug":
				case DEBUG:		level = DEBUG; break;
				
				case "warn":
				case WARN:		level = WARN; break;
				
				case "error":
				case ERROR:		level = ERROR; break;
				
				default:		level = OFF;
			}
			Debug.levels[topic] = level;

			// set in a cookie for next time
			//	NOTE: these are set to expire when the browser closes
			document.cookie = "debug-"+topic+"="+level;
		},
		
		// show the debug log for a particular topic
		show : function(topic) {
			if (!this.logs[topic]) return;
			
			console.group("Debug log for topic '"+topic+"' at "+new Date());
			Debug.logs[topic].forEach(function(entry) {
				console.log.apply(console, entry);
//				if      (entry[0] == DEBUG) console.log.apply(console, entry.slice(1));
//				else if (entry[0] == WARN) 	console.log.apply(console, entry.slice(1));
//				else if (entry[0] == ERROR) console.log.apply(console, entry.slice(1));
			});
			console.groupEnd();
		},
		
		// clear the debug log for a particular topic
		clear : function(topic) {
			this.logs[topic] = [];
		}
	}
	
	window.Debuggable = {
		// give the element debug methods
		// set _debugTopic
		// if a constructor, make instances debuggable as well
		applyTo : function(it, topic) {
			if (!topic && it.ClassName) topic = it.ClassName;
			if (!topic) throw "Debuggable.applyTo("+it+"): must provide a topic.";
	
			// methods added to Debuggables
			// TODO: cap debug logs at a particular length?
			var debugLog = Debug.logs[topic] = [];

			// set the initial debug level from a cookie
			Debug.levels[topic] = parseInt(Loader.getCookie("debug-"+topic) || OFF);
	
			var debugMethods = {
				_debug : function _debug() {
					if (Debug.levels[topic] < DEBUG && !Debug.logAllDebugs) return;
					var args = argsToArray(DEBUG_STRING, this, arguments);
					debugLog[debugLog.length] = args;
					// if debugging, write to window.status
					if (Debug.levels[topic] >= DEBUG) window.status = args.slice(1).join(" ");
				},
				
				_warn : function _warn() {
					// always add warn messages to the debugLog
					var args = argsToArray(WARN_STRING, this, arguments);
					debugLog[debugLog.length] = args;
					// if warning, write to console
					if (Debug.levels[topic] >= WARN) console.warn.apply(console, args.slice(1));
				},
				
				_error : function _error() {
					// always add error messages to the debugLog
					var args = argsToArray(ERROR_STRING, this, arguments);
					debugLog[debugLog.length] = args;
					// if erroring, write to console
					if (Debug.levels[topic] >= ERROR) console.error.apply(console, args.slice(1));
				}
			}
	
			// add methods to it
			for (var prop in debugMethods) {
				it[prop] = debugMethods[prop];
			}
			
			// if it is a constructor, add methods to its prototype as well
			if (typeof it == "function" && it.prototype.constructor == it) {
				for (var prop in debugMethods) {
					it.prototype[prop] = debugMethods[prop];
				}
			}
		}	
	}
	
	
	// utility method to combine arguments efficiently
	function argsToArray(level, target, args) {
		if (Debug.stringizeTarget) target = ""+target;
		var output = [level, target];
		for (var i = 0, len = args.length; i < len; i++) {
			output[output.length] = args[i];
		}
		return output;
	}
	
	
})();		// End Debuggable mixin

// make the Loader debuggable
Debuggable.applyTo(Loader, "Loader");