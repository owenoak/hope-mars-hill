extend(Date, {

	// TRANSLATE
	// TODO: some way to derive these from toLocaleString()?
	MONTH_NAMES : ["January", "February", "March", "April", "May", "June", 
				   "July", "August", "September", "October", "November", "December"],
	MONTH_ABBREVIATIONS : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
						   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
	DAY_NAMES : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
	DAY_ABBREVIATIONS : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
	
	MERIDIANS : ["AM", "PM"],


	// format abbreviations:
	//
	//		Y			- short year  (8)
	//		YY			- short year padded to 2 digits ("08")
	//		YYYY		- full year ("2008")
	//
	//		M			- month number (1-12)
	//		MM			- month number padded to 2 digits (01-12)
	//		MMM			- month abbrev ("Jan")
	//		MMMM		- month name ("January")
	//
	//		D			- day number
	//		DD			- day number padded to 2 digits
	//
	//		E			- day of week number (1-7)
	//		EE			- day of week number padded to 2 digits (01-07)
	//		EEE			- day of week abbreviation ("Wed")
	//		EEEE		- full day of week (Wednesday)
	//
	//		h			- hour (1-12)
	//		hh			- hour padded to 2 digits (01-12)
	//
	//		k			- hour in military time (0-23)
	//		Kk			- hour in military time padded to 2 digits (00-23)
	//
	//		m			- minute (0-59)
	//		mm			- minute padded to 2 digits (00-59)
	//
	//		s			- second (0-59)
	//		ss			- second padded to 2 digits (00-59)
	//
	//		l			- milliseconds (0-1000)
	//		ll			- second padded to 2 digits (00-1000)
	//		llll		- second padded to 4 digits (0000-1000)
	//
	//		a			- "a" or "p" for "AM" or "PM" marker
	//		aa			- "am" or "pm"
	//
	//		A			- "A" or "P" for "AM" or "PM" marker
	//		AA			- "AM" or "PM"
	//		
	// TODO: timezone?
	//
	FORMATTER_FUNCTIONS : {
		"Y"		: function(date) {	return (date.getFullYear() % 100) },
		"YY"	: function(date) {	return (date.getFullYear() % 100).pad(2) },
		"YYYY"	: function(date) {	return date.getFullYear()	},
	
		"M"		: function(date) {	return (date.getMonth() + 1) },
		"MM"	: function(date) {	return (date.getMonth() + 1).pad(2)	},
		"MMM"	: function(date) {	return date.getMonthAbbreviation() },
		"MMMM"	: function(date) {	return date.getMonthName() },
		
		"D"		: function(date) {	return date.getDate() },
		"DD"	: function(date) {	return date.getDate().pad(2) },

		"E"		: function(date) {	return (date.getDay() + 1) },
		"EE"	: function(date) {	return (date.getDay() + 1).pad(2)	},
		"EEE"	: function(date) {	return date.getDayAbbreviation() },
		"EEEE"	: function(date) {	return date.getDayName() },
		
		"h"		: function(date) {	var h = date.getHours() % 12; return (h == 0 ? 12 : h) },
		"hh"	: function(date) {	var h = date.getHours() % 12; return (h == 0 ? 12 : h).pad(2) },

		"k"		: function(date) {	return date.getHours() },
		"kk"	: function(date) {	return date.getHours().pad(2) },

		"m"		: function(date) {	return date.getMinutes() },
		"mm"	: function(date) {	return date.getMinutes().pad(2) },

		"s"		: function(date) {	return date.getSeconds() },
		"ss"	: function(date) {	return date.getSeconds().pad(2) },

		"l"		: function(date) {	return date.getMilliseconds() },
		"llll"	: function(date) {	return date.getMilliseconds().pad(4) },
		
		"aa"	: function(date) {	return date.getMeridian().toLowerCase() },
		"AA"	: function(date) {	return date.getMeridian() }
	},
	
	FORMATTERS : {},

	// TODO: create a parser from the formatter (use 'name' as "to<name>" and "parse<name>")
	// TODO: have date.parse() try different formatters?
	// TODO: use 'xxx' for literal strings?
	FORMAT_SPLITTER : /([^YMDEhkmslaA]+)|([YMDEhkmslaA]+)/g,
	makeFormatter : function(formatString, name) {
		if (!Date.FORMATTERS[formatString]) {
			var formatMethods = formatString.match(Date.FORMAT_SPLITTER);
			formatMethods.forEach(function(item, index) {
				var method = Date.FORMATTER_FUNCTIONS[item];
				if (method) formatMethods[index] = method;
			});
			
			Date.FORMATTERS[formatString] = function toString() {
				var output = "";
				formatMethods.forEach(function(method) {
					if (typeof method == "function") output += method(this);
					else							 output += method;
				}, this);
				return output;
			}
		}
		
		if (name) {
			var toStringName = "to"+name.capitalize();
			Date.prototype[toStringName] = Date.FORMATTERS[formatString];
			Date.FORMATTERS[toStringName] = Date.FORMATTERS[formatString];
		}
	}

});

// TODO: - cast the below as getters ?
//		 - cast all date properties (eg: hours, etc) as getters?
extend(Date.prototype, {

	// "AM" or "PM"
	getMeridian : function getMeridian() {
		return Date.MERIDIANS[date.getHours() > 12 ? 0 : 1];	
	},

	getMonthName : function getMonthName() {
		return Date.MONTH_NAMES[date.getMonth()];
	},
	
	getMonthAbbreviation : function getMonthAbbreviation() {
		return Date.MONTH_ABBREVIATIONS[this.getMonth()];	
	},
	
	getDayAbbreviation : function getDayAbbreviation() {
		return Date.DAY_ABBREVIATIONS[date.getDay()];
	},
	
	getDayName : function getDayName() {
		return Date.DAY_NAMES[date.getDay()];
	}


});
