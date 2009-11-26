
//
// special mouse events:
//		"mouseenter", "mouseleave", "hoverstart", "hover" and "hoverstop"
//
//	Hovering behavior:
//		- if mouse is within target (or its desendants) for at least hoverDelay msec
//			- fire "hoverstart"
//			- while mouse is still inside target or descendants, 
//				- repeatedly fire "hover" every stillActiveDelay msec
//			- when mouse leaves target:
//				- fire "hoverstop"
//
//	NOTE: the same invocation functions are set up for each of these events
//
//	Set element.hoverDelay to # of msec to change the delay.
//
//	FIXME:  
//
(function() {
	Element.prototype.hoverDelay = 500;

	var eventNames = ["mouseenter", "mouseleave", "hoverstart", "hover", "hoverstop"];

	function eventInsideTarget(event, target) {
//console.warn(event.type, event.relatedTarget, target);
		var relatedTarget = event.relatedTarget;
		var isInsideTarget = (relatedTarget && relatedTarget != target && !relatedTarget.isChildOf(target));
//		if (isInsideTarget) event.stop();
		return isInsideTarget;
	}

	// check the mouseover event to see if we should fire any of our special events
	// NOTE:  "this" is the element in question
	function checkHoverStart(event) {
		// return if this event is not meant for us
		if (!eventInsideTarget(event, this)) return;

		// fire the "onmouseenter" event on us
		if (this.isObserving("mouseenter")) this.fire("mousenter", event);
		
		// if we're observing any of the hover events, set up to fire that event after a delay
		if (!this.isHovering && this.isObserving(["hoverstart", "hover", "hoverstop"])) {
			// set up a timer to check for hovering
			if (this.data.hoverStartTimer) 	clearTimeout(this.data.hoverStartTimer);
			if (this.data.hoverInterval) 	clearInterval(this.data.hoverInterval);
			var element = this;
			this.data.hoverStartTimer = 
					setTimeout(
						function() { 
							element.isHovering = true;
							if (element.isObserving("hoverstart")) {
								element.fire("hoverstart");
							}
							
							element.data.hoverInterval = setInterval(
								function() {
									if (element.isObserving("hover")) {
										element.fire("hover");
									}
								},
								element.stillActiveDelay
							);
						}, 
						element.hoverDelay
					);
		}
	}
	
	// check the mouseout event to see if we should fire any of our special events
	// NOTE:  "this" is the element in question
	function checkHoverStop(event) {
		if (!eventInsideTarget(event, this)) return;
		
		// stop check for "hoverstart" events
		if (this.data.hoverStartTimer) {
			clearTimeout(this.data.hoverStartTimer);
			delete this.data.hoverStartTimer;
		}
		
		// stop interval for "hover" events
		if (this.data.hoverInterval) {
			clearInterval(this.data.hoverInterval);
			delete this.data.hoverInterval;
		}

		// only fire hoverstop if we're actually hovering
		if (this.isHovering) {
			this.fire("hoverstop", event);
			delete this.isHovering;
		}
		if (this.isObserving("mouseenter")) this.fire("mouseleave");
	}
	
	Element.registerEvent(eventNames,
		// "this" is the element in question
		function observe(eventName) {
			if (!this.isObserving(eventNames)) {
				this.addEventListener("mouseover", checkHoverStart, false);
				this.addEventListener("mouseout", checkHoverStop, false);
			}
		},
		
		function ignore(eventName) {
			this.removeEventListener("mouseover", checkHoverStart, false);
			this.removeEventListener("mouseout", checkHoverStop, false);			
		}
	);
})();


