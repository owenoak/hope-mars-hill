

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
//			- toggle(eventName, fn1, fn2, fn3...) to toggle between different functions?
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

			eventNames.split("|").forEach(function(item) {
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
				this.setAttribute("observing", data.observing.join("|"));
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

		// Return the default target of our events as set in our "target" attribute.
		//	(This will generally be a Control of some sort.)
		// If no "target" was specified, defaults to this element itself.
		get eventTarget() {
			if (this.data.eventTarget === undefined) {
				var target = this.getAttribute("target");
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

			}, this);
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
	//			- add observe/etc to window
	document.hookupEvents = Element.prototype.hookupChildEvents;

	// register a document.onload handler to hook up events for all elements
	document.whenLoaded(document.hookupEvents);

	// on window.onload, clear the data attribute of all elements
	window.addEventListener("unload", document.clearElementData, false);

})();
