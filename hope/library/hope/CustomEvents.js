
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
		var isInsideTarget = (relatedTarget && relatedTarget != target && !relatedTarget.childOf(target));
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


//
// special mouse event:
//		"mousestilldown"
//	Fires on an element every 100 msec while the mouse is still down in the element.
//	Set element.stillActiveDelay to # of msec to change the delay.
//
(function(){
	Element.prototype.stillActiveDelay = 100;
	
	function mouseStillDownStart(event) {
		var element = this;
		this.data.stillDownInterval 
			= setInterval(
				function() {
					if (element.isObserving("mousestilldown")) element.fire("mousestilldown");
				},
				this.stillActiveDelay
			);
	}
	
	function mouseStillDownStop(event) {
		if (this.data.stillDownInterval) {
			clearInterval(this.data.stillDownInterval);
			delete this.data.stillDownInterval;
		}
	}
	
	Element.registerEvent("mousestilldown", 
		// "this" is the element in question
		function observe(eventName) {
			if (!this.isObserving("mousestilldown")) {
				this.addEventListener("mousedown", mouseStillDownStart, false);
				this.addEventListener("mouseup", mouseStillDownStop, false);
			}
		},
		
		function ignore(eventName) {
			this.removeEventListener("mousedown", mouseStillDownStart, false);
			this.removeEventListener("mouseup", mouseStillDownStop, false);			
		}
	);

})();



// ::
// ::	Drag and drop support
// ::
//
// 		events:  "dragstart", "drag", "dragstop", "dragover", "dragout", "drop"
//
(function(){
	Element.prototype.dragStartDistance = 5;
	
	var dragEvents = ["dragstart", "drag", "dragstop"];
	
	// when mouse goes down, check mousemove and start dragging if the mouse
	//	moves more than dragStartDistance from the target
	//	"this" is the element with the drag events set up.
	function checkDragStart(event) {
		Event.dragStart = {
			target : this,
			x : Event.x,
			y : Event.y
		}
		
		// hookup global mousemove and mouseup events to monitor dragging
		document.addEventListener("mousemove", onDragMove, true);
		document.addEventListener("mouseup", onDragStop, true);

		// stop the event so that we don't select text within the target
		event.stop();
	}
	
	// "this" is the document
	function onDragMove(event) {
		if (Event.dragTarget) {
			if (Event.dragTarget.isObserving("drag")) Event.dragTarget.fire("drag", event);
			
		} else if (Event.dragStart) {
			var target = Event.dragStart.target;

// TODO: figure out the dragOffset			
			if (	Math.abs(Event.x - Event.dragStart.x) >= target.dragStartDistance
				 || Math.abs(Event.y - Event.dragStart.y) >= target.dragStartDistance) 
			{
				Event.dragTarget = target;
				if (Event.dragTarget.isObserving("dragstart")) target.fire("dragstart", event);
			}
		}
	}
	
	// "this" is the document
	function onDragStop(event) {
		if (Event.dragTarget) {
			if (Event.dragTarget.isObserving("dragstop")) Event.dragTarget.fire("dragstop", event);
			delete Event.dragTarget;
			delete Event.dragStart;
		}
		document.removeEventListener("mousemove", onDragMove, true);
		document.removeEventListener("mouseup", onDragStop, true);
	}
	
	Element.registerEvent(dragEvents,
		// "this" is the element in question
		function observe(eventName) {
			if (!this.isObserving(dragEvents)) {
				this.addEventListener("mousedown", checkDragStart, false);
			}
		},
		
		function ignore(eventName) {
			this.removeEventListener("mousedown", checkDragStart, false);
		}
	);
	
})();
