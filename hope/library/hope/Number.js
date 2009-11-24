// ::
// :: String manipulation ::
// ::
extend(Number.prototype, {
	pad : function pad(digits) {
		var string = ""+this;
		while (string.length < digits) {
			string = "0" + string;
		}
		return string;
	},

	limitDigits : function limitDigits(digits) {
		if (digits == null) digits = 0;
		var factor = Math.pow(10, digits);
		return Math.floor(this * factor) / factor;
	},
	
	percent : function percent(digits) {
		return (this * 100).limitDigits(digits) + "%";
	}
});

