
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
