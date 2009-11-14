

// simple cookie munger:
//	use:  	cookie[<key>]								to get cookie for key
//			cookie.set(<key>,<value>[,<expiresAsDate>])	to set cookie for key
//			cookie.clear(<key>)							to clear a cookie
window.__defineGetter__("cookie", function() {
	var output = (""+document.cookie).tupelize("; ","=", true);
	// HACKish:  make cookie.set() call window.setCookie()
	//			 make cookie.clear() call window.clearCookie()
	output.set = window.setCookie;
	output.clear = window.clearCookie;
	return output;
});
window.setCookie = function(key, value, expires) {
	document.cookie = key + "=" + 
		(typeof value == "string" ? escape(value) : JSON.stringify(value)) + 
		(expires ? ";expires="+expires.toUTCString() : "");
	return cookie[key];
};

window.clearCookie = function(key) {
	window.setCookie(key, "", new Date(1970,0,0));
}



// simple key:value storage thinger
//	- converts to/from objects with serialize() and deserialize()
//
//	remember(key[, newValue])		- 1 arg: return remembered value for <key>
//									- 2 args: remember new value and return it
//	forget(key)						- forget value stored under <key> (but return old value)
window.remember = function(key, value) {
	if (value != undefined) {
		localStorage[key] = serialize(value);
	}
	return deserialize(localStorage[key]);
}
window.forget = function(key) {
	var oldValue = deserialize(localStorage[key]);
	delete localStorage[key];
	return oldValue;
}

