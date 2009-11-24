Element.extend({
	// duration of an animation by default
	animationDuration : 250,

	// number of steps for an animation by default
	animationSteps : 10,
	fade : function(duration, callback, direction) {
		if (!duration) duration = parseInt(this.animationDuration);
		var startOpacity = parseFloat(this._startOpacity
							|| (this._startOpacity = (this.get("opacity") || 1))
						   );

		var element = this,
			delta = startOpacity / this.animationSteps,
			index = 0
		;

		if (direction == "out") {
			var opacity = startOpacity;
			delta = -1 * delta;
			function end()	{	element.style.display = "none"; element.style.opacity = startOpacity;}
		} else {
			var opacity = this.style.opacity = 0
			this.style.display = "";
			function end()	{}
		}

		function step() {
			if (++index > element.animationSteps) {
				clearInterval(interval);
				end();
				if (callback) callback();
			}
			element.style.opacity = (opacity += delta);
		}
		var interval = setInterval(step, duration / this.animationSteps);
	},

	fadeIn : function(duration, callback) {
		this.fade(duration, callback, "in");
	},

	fadeOut : function(duration, callback) {
		this.fade(duration, callback, "out");
	}

});
