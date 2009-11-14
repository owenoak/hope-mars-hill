// quick-and-dirty (and UNSAFE!) JSON object for older versions of browsers that don't suport it
if (!window.JSON) {
	window.JSON = {
		parse : function(json) {
			var script = "(function(){return "+json+"})()";
			return eval(script);
		}
	}
}

Loader.makeLoadable("JSON", null, ".json", function loadJSON(url) {
	return JSON.parse(Loader.loadText(url));
});