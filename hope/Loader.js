/*
	Loader for HOPE system.
	
	Note that this loads the "hope" package by default, which will likely load other stuff.

	TOTEST:
		* when loading cached package, do we need to do preloads regardless of whether the cache worked or not?
			- there may be a problem with dependencies not being preloaded... ?

	FIXME:
		* Safari not working with cache properly -- set Loader.useCache = true to expose

*/


//
//	TODO: simple browser sniffing and:
//			1) if IE, redirect them to "chromeFrame.html" page or
//			2) if Moz or WebKit, load Moz/WebKit specific adaptor (necessary?) or
//			3) tell them their browser is not supported
//


// :: Loader ::
// Loading files, scripts, stylesheets, etc
window.Loader = {
	loaderScriptName : "Loader.js",		// name of the script to use to derive the hope path

	useCache : false,			// if true, we try to pull package (and other) files from the cache

	ExtensionMap : {},			// map of extension -> loader for that extension

// TODO: make sure we're still using all of the below

	Packages : {},				// pointer to packages by path and by package name
	Paths : {},					// interesting paths for substitutions in URLs
	Loaded : {},				// urls we've already loaded
	LoadCallbacks : {},			// methods to execute for things that need loading
	Things : {},				// map of thing -> implementation files
	Dependencies : {},			// map of thing -> dependencies
	
	UNLOADED : undefined,
	LOADING : false,
	LOADED : true,
	LOAD_ERROR : "error",
	
	// initialize the loader (called below, right after Loader is declared)
	initialize : function() {
		var documentPath = (""+window.location).toLocation().fullpath,
			basePath = documentPath
		;

		// path to the document
		Loader.Paths.document = documentPath;

		// NOTE: assumes that this document is at the top-level for its 'app'
		Loader.Paths.app = documentPath;

		// look at all the scripts in the document
		var scripts = document.querySelectorAll("script[src]");

		Array.forEach(scripts, function(script) {
			var src = Loader.absoluteUrl(script.src);
			// mark them as loaded
			Loader.setLoadResult(src);

			// and note the hopePath if found
			if (src.toLocation().file == Loader.loaderScriptName) {
				basePath = Loader.absoluteUrl(src.toLocation().fullpath + "../");
			}
		});

		//
		// pre-determine a few package paths
		//
		
		// base of hope system
		Loader.Paths.base = basePath;
		
		// library directory
		Loader.Paths.library = basePath + "hope/library/";
		
		// cache directory (for pre-compiled scripts)
		Loader.Paths.cache = basePath + "cache/";
		
		// test directory
		Loader.Paths.test = basePath + "test/";
		
		//
		// add the load methods/etc to the window so we can call them directly
		//	(NOTE: this may be removed at some point, so don't count on it for
		//			more than debugging purposes)
		//
//		for (var name in Loader) {
//			var it = Loader[name];
//			if (typeof it == "function") window[name] = it;
//		}
	},
	
	// bootstrap load hope package
	loadHopePackage : function() {
		// bootstrap load of scripts in the "hope" package
		//	(we will initialize it as a Package later)
		var hopePath = Loader.absoluteUrl("{library}hope/"),
			hopePkgUrl = hopePath + "hope.package.xml",
			xml = Loader.loadXML(hopePkgUrl)
		;
		Loader.setLoadResult(hopePkgUrl, xml);

		var	files = xml.querySelectorAll("[url][preload]"),
			urls = Loader.absoluteUrls(files, hopePath)
		;

		Loader.loadFiles(urls, 
			function callback() {	
				Loader._debug("loadHopePackage(): Done with bootstrap -- creating hope package");
				Package.load(hopePkgUrl,null, null, xml);
			}, 
			function errback(url, error) {
				Loader._error("loadHopePackage(): Error loading ",url,": ",error);
			}, 
			true	// skip extensions we don't understand (we'll pick them up later)
		);
	},

	
	// mark a url (or class name or...) as loaded
	// you can pass a single string or an array of strings
	setLoadResult : function(it, value) {
		if (value == undefined) value = Loader.LOADED;
		
		if (it.forEach) {
			return it.map(function(it){return Loader.setLoadResult(value)});
		}
		
		if (it.indexOf("{") > -1) it = Loader.absoluteUrl(it);
		return (Loader.Loaded[it] = value);
	},
	
	// return true if it has already been loaded or it is currently loading now
	// you can pass an array in which case returns true only if all are loaded
	isLoaded : function(it) {
		if (it.every) return it.every(Loader.isLoaded);
		return Loader.Loaded[it];
	},
	
	
	// given a list of urls (and maybe a base path)
	//	return the absolute urls of any items which have not been loaded
	unloadedFiles : function(urls, base) {
		if (!urls) return;
		var unloaded = [];
		Array.forEach(urls, function(url) {
			url = Loader.absoluteUrl(url, base);
			if (!Loader.isLoaded(url)) unloaded.push(url);
		});
		return (unloaded.length == 0 ? null : unloaded);
	},
	
	// add a method to be called when something finishes loading
	addLoadCallback : function(what, callback) {
		if (!Loader.LoadCallbacks[what]) Loader.LoadCallbacks[what] = [];
		Loader.LoadCallbacks[what].push(callback);
	},
	
	executeLoadCallbacks : function(what) {
		var callbacks = Loader.LoadCallbacks[what];
		if (callbacks) {;
//console.group("executing load callbacks for "+what);
			callbacks.forEach(function(callback) {
//	console.warn("executing callbacks:\n"+callback);
				callback();
			});
//console.groupEnd();
		}
	},
	
	// load a file as text (will load same url more than once)
	loadText : function (url, defer, callback, errback, errHint) {
		url = Loader.absoluteUrl(url);
		var request = new XMLHttpRequest();
		var callbackWhenDone = function () {
			// wait until 'Completed' if a synchronous call
			if (request.readyState != 4) return;
			
			// error state
			if (request.status < 200 || request.status > 300) {
				if (errback) return errback(url);
				if (!errHint) errHint = "Loader.loadText('"+url+"'): ";
				throw errHint + ": Error loading file ("+request.status+")";
			}
			var text = request.responseText;
			if (callback) return callback(text, request);
			return text;
		}

		if (defer) request.onreadystatechange = callbackWhenDone;
		request.open("GET", url, defer==true);
		request.send();
		if (!defer) return callbackWhenDone();
	},

	// load a file as XML (will load the same url more than once)
	loadXML : function (url, defer, callback, errback) {
		url = Loader.absoluteUrl(url);
		var request = new XMLHttpRequest();
		var callbackWhenDone = function () {
			// wait until 'Completed' if a synchronous call
			if (request.readyState != 4) return;
			
			// error state
			if (request.status < 200 || request.status > 300) {
				if (errback) return errback(url);
				throw "Loader.loadText('"+url+"'): Error loading file ("+request.status+")";
			}
			var xml = request.responseXML;
			if (callback) return callback(xml, request);
			return xml;
		}

		if (defer) request.onreadystatechange = callbackWhenDone;
		request.open("GET", url, defer==true);
		request.send();
		if (!defer) return callbackWhenDone();
	},
	
	
	// load one or more classes, JS or CSS files and execute callback when they are all done
	load : function(things, callback, errback) {
		// get the dependencies of the things passed in
		//	which will be all the URLs (or manifest entries) needed to load the things
		
		// errback to swallow (but log) errors
		if (!errback) errback = function(error){	Loader._error(error);	};
		
		var urls = Loader.getDependencies(things);
		return this.loadFiles(urls, callback, errback);
	},

	
	
	// set up a new loadable thing
	//	
	//	
	//	NOTE: assumes the loadMethod:
	//			- throws an exception if it couldn't load the file
	//			- does NOT do any checking to see if that file is already loaded
	//			- takes the following arguments:
	//
	//				function loadSomething(url, defer, callback, errback)
	//		where		
	//					url = any valid url
	//					defer = true means we don't block waiting for this to finish
	//						- note that 'defer' may have penalties (such as making debugging harder)
	//						- note that each item loader can have its default defer()
	//					callback to execute when loaded, as:  callback(result, url)
	//					errback to execute on exception, as:  errback(error, url)
	//						- if errback (re)throws an error, that stops subsequent loading
	//						- if errback swallows the error, subsequent loading continues
	//		and returns
	//					if deferring, Loader.LOADING
	//					if not deferring, actual file contents from the load
	//	
	makeLoadable : function(info) {
		var loadOne = "load" + info.type,
			loadMany = "load" + (info.plural ? info.plural : info.type + "s")
		;

		if (info.defer == true) {
			Loader[loadOne] = info.loadOne = function loadOne(url, callback, errback) {
				url = (info.getUrl ? info.getUrl(url) : Loader.absoluteUrl(url));
				try {
					var result = Loader.Loaded[url] || info.load(url, callback, errback);
					return (Loader.Loaded[url] = result);
				} catch (e) {
					Loader.Loaded[url] = Loader.LOAD_ERROR;
					if (errback) return errback(e, url);
					throw e;
				}
			}		

			Loader[loadMany] = info.loadMany = function loadMany(urls, callback, errback) {
				var results = {},
					loadNext = Loader._makeLoadingQueue(urls, info.loadOne, callback, errback, results)
				;
				loadNext();
				return results;
			}
		} else {

			// NOTE: assumes:	- url is already an absolute url
			//					- callback takes 	(results, url)
			//					- errback takes 	(exception, url)
			Loader[loadOne] = info.loadOne = function loadOne(url, callback, errback) {
				url = (info.getUrl ? info.getUrl(url) : Loader.absoluteUrl(url));
				try {
					var result = Loader.Loaded[url] || info.load(url);
					if (callback) callback(result, url);
					return (Loader.Loaded[url] = result);
				} catch (e) {
					Loader.Loaded[url] = Loader.LOAD_ERROR;
					if (errback) return errback(e, url);
					throw e;
				}
			}
			
			Loader[loadMany] = info.loadMany = function loadMany(urls, callback, errback) {
				var results = {};
				Array.forEach(urls, function(url) {
					try {
						results[url] = info.loadOne(url);
					} catch (e) {
						if (errback)  	errback(e, url);
						else			throw e;
					}
				});
				if (callback) callback();
				return results;
			}
		}
		
		// now store the info to call this loader under each extension passed in
		if (info.extensions) {
			if (typeof info.extensions == "string") info.extensions = [info.extensions];
			info.extensions.forEach(function(extension) { 
				Loader.ExtensionMap[extension] = info;
			});
		}
	},
		
	// create a function to load each of the URLs in turn and call callback when done
	// EITHER:  urls is a list of strings and loadMethod is a function to load each one
	//	   OR:	urls is a list of [url, loadMethod] and loadMethod is ignored
	_makeLoadingQueue : function(urls, loadMethod, callback, errback, results) {
//console.info("making loading queue with ",urls);
		// if the individual load fails, call the errback passed in
		//	if that does not (re)throw, keep going
		function loaderErrback(error, url) {
//console.error("in loaderErrback", error);
			if (errback) {
				errback(error, url);
				loadNext();
			} else {
				throw error;
			}
		}
		
		var index = -1;
		function loadNext() {
			// if we're at the end of the list, call the callback and we're done
			if (++index == urls.length) {
//console.warn("loaded last item, calling :"+callback);
				if (callback) callback(results);
				return;
			}
			var url = urls[index];
			if (typeof url != "string") {
				loadMethod = url[1];
				url = url[0];
			}
			// if the url was already loaded, just go on to the next one
			if (Loader.isLoaded(url)) {
//console.warn(url + " is loaded already loaded - skipping to next");
				return loadNext();
			}

//console.warn("loading ",url," from queue");
			Loader.Loaded[url] = results[url] = loadMethod(url, loadNext, loaderErrback);
		}
		return loadNext;
	},	
	
	// load a bunch of files ONLY ONCE according to their extension
	//	returns true if everything was already loaded or has been loaded synchronously
	//	returns false if at least one thing could not be loaded synchronously
	//
	//	SIDE EFFECT: sets Loader.loadFilesResults to a map of {url:<load results>} of the urls
	//
	//	If callback is defined, only calls that when ALL are loaded as:
	//			callback(resultsMap)
	//	If errback is defined, calls that when things that can't be loaded is loaded as:
	//			errback(error, <urlThatFailed>, urls)
	//		If the errback (re)throws an error, stops loading process.
	//		If errback swallows error, keeps loading the next things.
	//
	loadFiles : function(urls, callback, errback, skipUnknownExtensions) {
		urls = Loader.absoluteUrls(urls);
		var results = Loader.loadFilesResults = {},
			asyncLoads = []
		;
		urls.forEach(function(url) {
			// skip things that have already been loaded
			if (Loader.Loaded[url]) {
				results[url] = Loader.Loaded[url];
				return;
			}

			try {
				var extension = url.toLocation().extension,
					info = Loader.ExtensionMap[extension]
				;
				if (!info && skipUnknownExtensions != true) {
					results[url] = Loader.Loaded[url] = Loader.loadText(url);
					
				} else if (info.defer != true) {
					results[url] = info.loadOne(url);
					
				} else {
					asyncLoads.push([url, info.loadOne]);
					Loader.Loaded[url] = Loader.LOADING;
				}
			} catch (e) {
				// If errback is defined, call it
				//		If it (re)throws an exception, we'll error out of loadFiles() entirely	
				if (errback) errback(e, url);
				// if errback is note defined, throw the error
				else		 throw e;
			}
		});
			
		// if there is nothing to load asynchronously, we're done!
		if (asyncLoads.length == 0) {
			if (callback) callback(results, urls);
			return true;
		} 

		// load asynchronous things one at a time
		var loadNext = Loader._makeLoadingQueue(asyncLoads, null, callback, errback, results);
		loadNext();	
		return false;		// signal that not everything was loaded
	},	
	

	// insert a bunch of JS as a <script> tag
	//	NOTE: this seems to ALWAYS swallow parse errors in Firefox
	//	NOTE: assumes Element.js has already been loaded
	insertScript : function(js, attributes) {
		try {
			var script = create("script", attributes);
			script.text = js;
			document.body.add(script);
		} catch (e) {
			console.error(e);
		}
		return script;
	},

	
	
	// load a library package
	loadLibrary : function(libraryName, callback) {
		Loader.loadPackage("{library}"+libraryName, callback);
	},
	
	pathTo : function(pkgName) {
		return Loader.Paths[pkgName];
	},
	
	getDependencies : function(things) {
		if (typeof things == "string") things = [things];
		var deps = [];
		things.forEach(function(thing) {
			var supers = Loader.Dependencies[thing];
			if (supers) {
				supers.forEach(function(superThing) {
					var superDeps = Loader.getDependencies(superThing);
					if (superDeps) superDeps.forEach(function(it) {
						if (deps.indexOf(it) == -1) deps.push(it);
					});
				});
			}
			if (Loader.Things[thing]) {
				if (deps.indexOf(thing) == -1) deps.push(thing);
				Loader.Things[thing].forEach(function(it) {
					if (deps.indexOf(it) == -1) deps.push(it);
				});
			} else {
				thing = Loader.absoluteUrl(thing);
				if (deps.indexOf(thing) == -1) deps.push(thing);
			}
		});
		return deps;
	},

	
	// utility methods

	normalizeUrl : function(url) {
		// if we were passed a manifest entry, it will have a "url" property
		if (typeof url == "object" && url.url) url = url.url;
		// TOWARN
		
		if (url.indexOf(".") == -1 && url.indexOf("//") == -1) return url;
		url = url.replace(/\/\.\/(\.\/)*/g,"/").replace(/([^:])\/\/+/g, "$1/");
		url = url.split("/");
		for (var i = 0; i < url.length; ) {
			if (url[i] == "..") 	url.splice(--i, 2);
			else					i++;
		}
		return url.join("/");
	},
	
	_namedPathMatcher : /\{(.*)\}/,
	expandNamedPath : function(url) {
		var match = url.match(Loader._namedPathMatcher);
		// if there is a package identifier in there, munge and continue
		if (match) {
			url = url.replace(Loader._namedPathMatcher, Loader.pathTo(match[1]));
		}
		return url;
	},
	
	_absoluteUrlCache : {},
	
	// convert the url to an absolute url using the location as a base
	// default base is the location of the loader file (?)
	absoluteUrl : function(url, base) {
		// if we were passed a manifest entry, it will have a "url" property
		if (typeof url == "object") {
			if (url.url) 				url = url.url;
			else if (url.getAttribute) 	url = url.getAttribute("url")
		}

		var cacheName = url + base;
		// if we've already munged at this one before, return it
		if (Loader._absoluteUrlCache[cacheName]) 
			return Loader._absoluteUrlCache[cacheName];
		
		url = Loader.expandNamedPath(url);

		if (url.indexOf("http:") != 0 && url.indexOf("file:") != 0) {
			base = Loader.expandNamedPath(base || "{document}");

			if (url.charAt(0) == "/") {
				url = base.toLocation().prefix + url;
			} else {
				url = base.toLocation().fullpath + url;
			}
		}
		
		return (Loader._absoluteUrlCache[cacheName] = Loader.normalizeUrl(url));
	},
	
	absoluteUrls : function(urls, base) {
		if (typeof urls == "string") urls = [urls];
		
		return Array.map(urls, function(url) {
			return Loader.absoluteUrl(url, base);
		});
	},


	// quick method to get a cookie value for a particular key
	getCookie : function getCookie(key) {
		var cookies = document.cookie.split(/\s*;\s*/);
		for (var i = 0, len = cookies.length; i < len; i++) {
			var cookie = cookies[i].split("=");
			if (cookie[0] == key) return cookies[i].substr(key.length);
		}
	},
	
	toString : function() {
		return "[Loader]";
	},
	
	//
	//	debugging shims
	//		these will be replace by Debuggable as soon as it loads
	//		so we'll eat any messages until that shows up
	//
	_debug : function() {},
	_warn : function() {},
	_error : function() {},
}



// add a loader for ".js" files
Loader.makeLoadable({
	type:"Script", 
	extensions: ".js", 
	defer : true,
	load : function loadScript(url, callback, errback) {
//console.info("loadScript() ",url)
		var script = document.createElement("script");
		script.onload = function() {
			Loader._debug("loadScript(",url,"): done loading script.");
			Loader.Loaded[url] = script;
			if (callback) callback();
		};
		script.setAttribute("src", url);
		if (errback) script.onerror = errback;
		(document.querySelector("head")||document.querySelector("html")).appendChild(script);

		return Loader.LOADING;	// indicate that we're current loading
	}
});


// add a simple ".css" file loader
//	this will be enhanced in Stylesheet.js
Loader.makeLoadable({
	type:"Stylesheet", 
	extensions: ".css", 
	load : function loadStylesheet(url) {
		Loader._debug("loadStyleshet(",url,"): including stylesheet.");
		var sheet = document.createElement("link");
		sheet.setAttribute("href",url);
		sheet.setAttribute("rel","stylesheet");
		sheet.setAttribute("type","text/css");
		(document.querySelector("head")||document.querySelector("html")).appendChild(sheet);
	}
});







// ::
// ::	Location -- break a url up into pieces (much like window.location)
// ::


// convert a url to a Location object
//	where you can query all of the href, prefix, path, etc below (as properties)
function Location(url) {
	if (typeof url != "string") throw "Location must be initialized with a string: "+url;
	
	if (Location.Cache[url]) {
		this.match = Location.Cache[url].match;
	} else {
		var normalizedUrl = Loader.normalizeUrl(url);
		this.match = Location.urlParser.exec(normalizedUrl);
		if (!this.match) throw "Location not understood: "+url;
		// remember both under the normalized URL and the original one passed in
		Location.Cache[url] = Location.Cache[normalizedUrl] = this;
	}
}
Location.Cache = {};
Location.urlParser = /(((?:(\w*:)\/\/)(([^\/:]*):?([^\/]*))?)?([^?]*\/)?)(([^?#.]*)(\.[^?#]*)|[^?#]*)(\?[^#]*)?(#.*)?/;

Location.prototype = {
	get href()		{ return "" + this.prefix + this.path + this.file + this.search + this.hash },
	get fullpath()	{ return "" + this.prefix + this.path },
	get prefix()	{ return this.match[2] || "" },
	get protocol()	{ return this.match[3] || "" },								
	get host()		{ return this.match[4] || "" },								
	get hostname()	{ return this.match[5] || "" },								
	get port()		{ return this.match[6] || "" },								
	get pathname()	{ return "" + this.path + this.file}, 
	get path()		{ return this.match[7] || "" },								
	get file()		{ return this.match[8] || "" },								
	get filename()	{ return this.match[9] || "" },								
	get extension()	{ return this.match[10] || "" },								
	get search()	{ return this.match[11] || "" },								
	get hash()		{ return this.match[12] || "" },
	get parameters(){ 
		if (!this.search) return undefined;
		var params = {};
		this.search.split("&").forEach(
			function(it){
				it=it.split("=");
				params[it[0]]=it[1]
			}
		)
		return params;
	}
}

// using string.asLocation is more efficient than creating many location objects
//	as it only makes a single Location object per string
String.prototype.toLocation = function() {
	var url = ""+this;
	return Location.Cache[url] || new Location(url);
};




//	::
//	::	Utility methods  -- kinda a hack that they're here, but we need 'em
//	::


// :: Array hack ::
//	- make sure Array.forEach and Array.map are defined so we can use them below
if (!Array.forEach) {
	Array.forEach = function forEach(list, callback, context) {	
		return Array.prototype.forEach.call(list, callback, context);
	}
	Array.map = function map(list, callback, context) {	
		return Array.prototype.map.call(list, callback, context);
	}
}

// initialize the Loader
Loader.initialize();

// TODO: if preloading, this should not be here!
Loader.loadHopePackage();
