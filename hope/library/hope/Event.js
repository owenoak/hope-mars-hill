// ::
// ::	Event -- changes to the native Event object & its prototype
// ::
(function() {
	Event.extend = extendPrototype;
	
	Event.extend({
		stop: function() {
		  this.preventDefault();
		  this.stopPropagation();
		  this.stopped = true;
		}
	
	});
})();



//
//	Keep track of event properties globally 
//	 so we can access them without an 'event' object
//

(function() {
	
	// Global handler to peek during mousemove events (on capture phase) to keep track of 
	//	where the mouse pointer actually is at all times.
	//
	//	You can at any time check   Event.x and Event.y   to see where the mouse currently is.
	//
	document.addEventListener("mousemove", function(event) {
		Event.x = event.pageX;
		Event.y = event.pageY;
	}, true);
	
	
	// Global handlers to peek during mousedown/mouseup events (on capture phase) 
	//	to keep track of which mouse button is being pressed.
	//
	//	You can at any time check:
	//			- Event.leftButton
	//			- Event.rightButton
	//	If the above is <true>, that button is down.
	//
	//	TODO: middle button support?
	//	TODO: is this correct for WebKit ??
	//
	function checkButton(event) {
		Event.leftButton  = (event.which == 1);
		Event.rightButton = (event.which == 3);

//		console.log("which:", event.which, "   left: ", Event.leftButton, "   right:", Event.rightButton);
	}
	function buttonUp() {
		delete Event.leftButton;
		delete Event.rightButton;
	}
	
	document.addEventListener("mousedown", checkButton, true);
	document.addEventListener("mouseup", buttonUp, true);
	
	
	// Global handlers to peek during keydown/keup events (on capture phase) 
	//	to keep track of which special keys are being pressed
	//
	//	You can at any time check:
	//			- Event.shiftKey
	//			- Event.metaKey
	//			- Event.commandKey  (alias for event.metaKey for Mac-oriented folks)
	//			- Event.altKey		
	//			- Event.optionKey   (alias for event.altKey for Mac-oriented folks)
	//			- Event.ctrlKey
	//	If the above is <true>, that button is down.
	//
	function checkSpecialKeys(event) {
		Event.shiftKey 						= event.shiftKey;
		Event.ctrlKey						= event.ctrlKey;
		Event.metaKey	= Event.commandKey	= event.metaKey;
		Event.altKey	= Event.optionKey 	= event.altKey;

//		console.info(
//			"shift:",  Event.shiftKey,
//			"  ctrl:", Event.ctrlKey,
//			"  meta:", Event.metaKey,
//			"   alt:", Event.altKey
//		);
	}
	
	// set 
	document.addEventListener("keydown", checkSpecialKeys, true);
	document.addEventListener("keyp", checkSpecialKeys, true);

	// fire the check handler on mousedown as well in case the mouse
	//	was not focused in the window when the key was pressed
	document.addEventListener("mousedown", checkSpecialKeys, true);
})();