


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
