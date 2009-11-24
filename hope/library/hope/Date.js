extend(Date, {

	MSEC_PER_DAY : 24 * 60 * 60 * 1000,
	MSEC_PER_HOUR : 60 * 60 * 100,
	
	// return a new date based on this one
	clone : function() {
		return new Date(this);
	},
	
	
	// set time of the date
	//	hours, min, sec all default to 0, meaning  date.setTime() sets to beginning of day
	set : function set(hours, min, sec) {
		this.setHours(  hour || 0);
		this.setMinutes(min  || 0);
		this.setSeconds(sec  || 0);
		this.setMilliseconds(0);
		return this;
	},
	
	
	// add the specified # of days (positive or negative) to the date, preserving the time
	// NOTE: this DOES work around daylight savings time
	addDays : function addDays(days) {
		// remember hours and minutes so we can reset them
		//	in case we're crossing a daylight savings boundary
		var startHours = this.getHours(),
			startMinutes = this.getMinutes()
		;
		this.setHours(12);	
		this.setTime(this.getTime() + (days * this.MSEC_IN_ONE_DAY));
		// reset to stored hours/mins
		this.setHours(startHours);
		this.setMinutes(startMinutes);
		return this;
	}
	
});