/*
	Loader for HOPE system.

	Note that this loads the "hope" package by default, which will likely load other stuff.

	TOTEST:
		* when loading cached package, do we need to do preloads regardless of whether the cache worked or not?
			- there may be a problem with dependencies not being preloaded... ?

	FIXME:
		* Safari not working with cache properly -- set Loader.useCache = true to expose

*/



// :: Loader ::
// Loading files, scripts, stylesheets, etc

/**
	Loader for hope system.
	Use the loader to load scripts, xml files, css files, etc.
	
	@namespace 
	@exports window.Loader as Loader
*/
window.Loader = {

	loaderCacheFileName	: "hope.js",	// name of this file if loaded from a cached (smooshed) file
	loaderUrl : undefined,				// url of the loader (set in initialize() )
	useCache : false,			// if true, we try to pull package (and other) files from the cache

	/** Map of `extension` -> `loader for that extension`. */
	ExtensionMap : {},			// 
	
	
	/** Map of `name` -> `path to that named thing`. */
	Paths : {},					// 

	/** Map of URLs and Things that we've already loaded. */
	Loaded : {},

	/** Map of methods to execute for things that are awaiting load. */
	LoadCallbacks : {},

	/** Map of `thing` -> `files that are needed to load the Thing`. */
	Things : {},
	
	/** Map of `thing` -> `things which are dependent on the Thing`. */
	Dependencies : {},			// map of thing -> dependencies


	/** 
		Flag that something has not been loaded. 
		@constant 
		@see Loader.isLoaded
	*/
	UNLOADED : undefined,
	
	/** 
		Flag that something is currently loading. 
		@constant
		@see Loader.isLoaded
	*/
	LOADING : false,
	
	/** 
		Flag that something has loaded successfully. 
		@constant
		@see Loader.isLoaded
	*/
	LOADED : true,
	
	/** 
		Flag that there was an error loading something.
		@constant 
		@see Loader.isLoaded		
	*/
	LOAD_ERROR : "error",

	/**
		Initialize the loader.
		Called automatically at end of Loader.js. 
	*/
	initialize : function() {
		var documentPath = (""+window.location).toLocation().fullpath,
			basePath = documentPath
		;

		// path to the document
		Loader.setPath("document", documentPath, false);

		// NOTE: assumes that this document is at the top-level for its 'app'
		Loader.setPath("app", documentPath, false);

		// At this point the loader path will be the src of the last script in the document
		// Figure out the base path relative to the URL of the loader file.
		var loaderScript = Loader.getLastScript(),
			loaderUrl = Loader.loaderUrl = loaderScript.src,
			loaderPath = loaderUrl.toLocation().fullpath,
			loaderFileName = loaderUrl.toLocation().file,
			basePath = (loaderPath + "/../").toLocation().fullpath
		;

		//
		// pre-determine a few package paths
		//

		// base of peers of hope system
		Loader.setPath("base", basePath, false);

		// cache directory (for pre-compiled scripts)
		Loader.setPath("cache", basePath + "cache/", false);

		// test directory
		Loader.setPath("test", basePath + "test/", false);

		// base of hope system
		Loader.setPath("hope", loaderPath, false);

		// library directory
		Loader.setPath("library", loaderPath + "library/", false);


		// any inlined script in the Loader script element should be executed
		//	after the loader finishes loading.
		var loaderCallback = loaderScript.innerHTML;
		if (typeof loaderCallback == "string") loaderCallback = new Function(loaderCallback);

		// if there is a 'packages' attribute of the loader script,
		//	load those packages after the hope package finshes loading
		//	(and call the loaderCallback once those packages have been loaded)
		var packages = loaderScript.getAttribute("packages");
		if (packages) {
			packages = packages.split(/\s*,\s*/);
			Loader.whenLoaded("package:hope", function() {
				Loader.loadPackages(packages, loaderCallback);
			});
		}
		// otherwise just execute the loaderCallback when the hope package has been loaded
		else {
			if (loaderCallback) {
				Loader.whenLoaded("package:hope", loaderCallback);
			}
		}

		// set things up so we mark all inlined script tags as loaded
		Loader.whenLoaded("document", Loader.markPageElementsAsLoaded);

		// If we are not loading from cache,
		//	load the hope package now with a bootstrap package loader.
		//	(The hope package will be initialized as a full package later.)
		if (loaderFileName != Loader.loaderCacheFileName) {
			Loader.loadHopePackage();
		}
	},

	/**
		Load the <i>hope</i> package, base functionality for everything in the hope system,
		Called automatically at end of Loader.initialize().
	*/
	loadHopePackage : function() {
		// bootstrap load of scripts in the "hope" package
		//	(we will initialize it as a Package later)
		var pkgPath = Loader.absoluteUrl("{library}hope/"),
			hopePkgUrl = pkgPath + "hope.package.xml",
			xml = Loader.loadXML(hopePkgUrl)
		;
		Loader.setLoadResult(hopePkgUrl, xml);

		var	files = xml.querySelectorAll("[url][preload]"),
			urls = Loader.absoluteUrls(files, pkgPath)
		;

		Loader.loadFiles(urls,
			function callback() {
				Loader._debug("loadHopePackage(): Done with bootstrap -- creating hope package");
				Package.load(hopePkgUrl, null, null, xml);
			},
			function errback(url, error) {
				Loader._error("loadHopePackage(): Error loading ",url,": ",error);
			},
			true	// skip extensions we don't understand (we'll pick them up later)
		);
	},

	/** Mark all script elements as in the page as loaded */
	markPageElementsAsLoaded : function() {
		var scripts = document.querySelectorAll("script[src]");
		Array.forEach(scripts, function(script) {
			var src = Loader.absoluteUrl(script.src);
			// mark them as loaded
			if (!Loader.Loaded[src]) Loader.onload(src, script);
		});

		var styles = document.querySelectorAll("link[rel=stylesheet]");
		Array.forEach(styles, function(style) {
			var src = Loader.absoluteUrl(style.href);
			// mark them as loaded
			if (!Loader.Loaded[src]) Loader.onload(src, style);
		});
	},

	/** Return the last script in the document.
		This should be the currently running script (at least during load). */
	getLastScript : function() {
		var scripts = document.querySelectorAll("script[src]");
		return scripts[scripts.length-1];
	},

	/** Mark a url (or class name or) as loaded.
		@param {String or String[]} it
			<li>String: Name or URL of thing to mark as loaded.</li>
			<li>String[]: List of names or URLs of things to mark as loaded.</li>
		@param flag Value for loading flag.  Defaults to `Loader.LOADED`.
	 */
	setLoadResult : function(it, value) {
		if (value == undefined) value = Loader.LOADED;

		if (it.map) {
			return it.map(function(it){return Loader.setLoadResult(value)});
		}

		if (it.indexOf("{") > -1) it = Loader.absoluteUrl(it);
		return (Loader.Loaded[it] = value);
	},

	/** Return true if `it` has already been loaded or is currently loading.
		@param {String or String[]} it
			<li>String: Name or URL to check.</li>
			<li>String[]: List of name or URLs to check.</li>
		@returns {Boolean} `true` if all items are loaded.
	*/
	isLoaded : function(it) {
		if (it.all) return it.all(Loader.isLoaded);
		return Loader.Loaded[it];
	},


	/** Given a list of urls (and maybe a base path)
		return the absolute urls of any items which have not been loaded. 
		@param {String[]} urls	List of urls to check.
		@param {String} [base] Base path for all non-absolute urls.
	*/
	unloadedFiles : function(urls, base) {
		if (!urls) return;
		var unloaded = [];
		Array.forEach(urls, function(url) {
			url = Loader.absoluteUrl(url, base);
			if (!Loader.isLoaded(url)) unloaded.push(url);
		});
		return (unloaded.length == 0 ? null : unloaded);
	},

	/** Add a method to be called when something finishes loading.
		@param {String} it A URL or a conceptual name like "document" or "package:hope".
		@param {Function} Function or string to eval when it is loaded.
	*/
	whenLoaded : function(it, callback) {
		if (it == document) it = "document";
		if (typeof callback == "string") callback = new Function(callback);

		// if it has already been loaded, just execute the callback
		if (Loader.isLoaded(it)) {
			callback();
		} else {
			if (!Loader.LoadCallbacks[it]) Loader.LoadCallbacks[it] = [];
			Loader.LoadCallbacks[it].push(callback);
		}
	},

	/** Execute the on load callback(s) for something and mark it as loaded.
		@param {String} it A URL or a conceptual name like "document" or "package:hope".
		@param [loadResult] The thing that was instantiated from this load 
			(eg: the Package instance).
	*/
	onload : function(it, loadResult) {
		Loader._debug(".onload(",it,",",loadResult,")");
		// mark the thing as loaded
		Loader.setLoadResult(it, loadResult);

		// and execute any load callbacks
		var callbacks = Loader.LoadCallbacks[it];
		if (callbacks) {;
			//console.group("executing load callbacks for "+it);
			callbacks.forEach(function(callback) {
				//console.warn("executing callbacks:\n"+callback);
				callback();
			});
			//console.groupEnd();

			// clear the list of callbacks on the off-chance that our "onload" is fired again
			delete Loader.LoadCallbacks[it];
		}
	},

	/** Load a URL as text.
		@note Will load the same url more than once.
		@param {String} url Url to load.
		@param {Boolean} [defer] (default: true) If true, we will defer the load (eg: asynchronous).
		@param {Function} [callback] Method to execute upon successful load.
		@param {Function} [errback] Method to execute if load fails.
		@param {String} [errHint] Hint to pass to the errback function 
			(eg: what you were doing that caused the load).
		@returns {String} If `defer == true`, returns contents of file as text.
						  If `defer == false`, returns null.
	*/
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

	/** Load a URL and return the result as an XML document.
		@note Will load the same url more than once.
		@param {String} url Url to load.
		@param {Boolean} [defer] (default: true) If true, we will defer the load (eg: asynchronous).
		@param {Function} [callback] Method to execute upon successful load.
		@param {Function} [errback] Method to execute if load fails.
		@param {String} [errHint] Hint to pass to the errback function 
			(eg: what you were doing that caused the load).
		@returns {String} If `defer == true`, returns contents of file as an xml document.
						  If `defer == false`, returns null.
	*/
	loadXML : function (url, defer, callback, errback, errHint) {
		url = Loader.absoluteUrl(url);
		var request = new XMLHttpRequest();
		var callbackWhenDone = function () {
			// wait until 'Completed' if a synchronous call
			if (request.readyState != 4) return;

			// error state
			if (request.status < 200 || request.status > 300) {
				if (errback) return errback(url);
				if (!errHint) errHint = "Loader.loadXML('"+url+"'): ";
				throw errHint + ": Error loading file ("+request.status+")";
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

	
	/* Load one or more conceptual things (classes, JS files, CSS files, etc.)
		and call callback when they have all finished loading.
		<br/><br/>
		Uses Loader.loadFiles to do the heavy lifting.
		<br/><br/>
		TODOC: doc errback methodology.
		
		@note Will <b>not</b> reload things which have already been loaded.
		@param {String[]} things Array of URLs or named Things to load.
		@param {Function} [callback] Method to execute when <b>all</b> items ave been loaded.
		@param {Function} [errback] Method to execute if load fails.
	*/
	load : function(things, callback, errback) {
		// get the dependencies of the things passed in
		//	which will be all the URLs (or manifest entries) needed to load the things

		// errback to swallow (but log) errors
		if (!errback) errback = function(error){	Loader._error(error);	};

		var urls = Loader.getDependencies(things);
		return this.loadFiles(urls, callback, errback);
	},



	/** Set up a new loadable thing.
		<pre>
		NOTE: assumes the loadMethod:
				- throws an exception if it couldn't load the file
				- does NOT do any checking to see if that file is already loaded
				- takes the following arguments:
	
					function loadSomething(url, defer, callback, errback)
			where
						url = any valid url
						defer = true means we don't block waiting for this to finish
							- note that 'defer' may have penalties (such as making debugging harder)
							- note that each item loader can have its default defer()
						callback to execute when loaded, as:  callback(result, url)
						errback to execute on exception, as:  errback(error, url)
							- if errback (re)throws an error, that stops subsequent loading
							- if errback swallows the error, subsequent loading continues
			and returns
						if deferring, Loader.LOADING
						if not deferring, actual file contents from the load
		</pre>
	*/
	makeLoadable : function(info) {
		var loadOne = "load" + info.type,
			loadMany = "load" + (info.plural ? info.plural : info.type + "s")
		;

		if (info.defer == true) {
			Loader[loadOne] = info.loadOne = 
			/** @ignore */
			function loadOne(url, callback, errback) {
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

			Loader[loadMany] = info.loadMany = 
			/** @ignore */
			function loadMany(urls, callback, errback) {
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
			
			Loader[loadOne] = info.loadOne = 
			/** @ignore */
			function loadOne(url, callback, errback) {
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

			
			Loader[loadMany] = info.loadMany = 
			/** @ignore */
			function loadMany(urls, callback, errback) {
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

	/** Create a function to load each of the URLs in turn and call callback when done.
		<pre>
		 EITHER:  urls is a list of strings and loadMethod is a function to load each one
	  	     OR:	urls is a list of [url, loadMethod] and loadMethod is ignored
	  	 </pre>
	*/
	_makeLoadingQueue : function(urls, loadMethod, callback, errback, results) {
//console.info("making loading queue with ",urls);
		// if the individual load fails, call the errback passed in
		//	if that does not (re)throw, keep going
		/** @ignore */
		function loaderErrback(error, url) {
//console.error("in loaderErrback", error);
			Loader._error("Error loading url '"+url+"'");
			if (errback) {
				errback(error, url);
				loadNext();
			} else {
				throw error;
			}
		}

		var index = -1;
		/** @ignore */
		function loadNext() {
			// if we're at the end of the list, call the callback and we're done
			if (++index >= urls.length) {
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



	/** Load a bunch of files ONLY ONCE according to their extension.
		@returns {Boolean} `true` if everything was already loaded or has been loaded synchronously, or
						<br/>`false` if at least one thing could not be loaded synchronously
	
		@sideeffect Sets Loader.loadFilesResults to a map of {url:<load results>} of the urls.
	
		<pre>
		If callback is defined, only calls that when ALL are loaded as:
				callback(resultsMap)
		If errback is defined, calls that when things that can't be loaded is loaded as:
				errback(error, <urlThatFailed>, urls)
			If the errback (re)throws an error, stops loading process.
			If errback swallows error, keeps loading the next things.
		</pre>
	*/
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


	/** Insert a bunch of JS as a &lt;script&gt; tag, which executes it immediately.
		@note This seems to ALWAYS swallow parse errors in Firefox.
		@note Assumes Element.js has already been loaded.
		@param {String} js Javascript code to execute.
		@param {Object} [attributes] Object of attributes to assign to the new script element.
		@returns {Element}	Returns pointer to the new script element.
	*/
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



	/** Load a library package.
		@param {String} libraryName Name of the library to load.
		@param {Function} [callback] Callback to execute after load.
	*/
	loadLibrary : function(libraryName, callback) {
		Loader.loadPackage("{library}"+libraryName, callback);
	},



	/** Return the path to some Thing 
		@param {String} thing Name of the thing whose path you want.
		@returns {String} String path or `undefined`.
	*/
	pathTo : function(thing) {
		return Loader.Paths[thing];
	},


	/** Set the path to some thing.
		@param {String} thing Name of the thing whose path you want.
		@returns {String} String path or `undefined`.
	*/
	setPath : function(thing, path, absolutize) {
		if (absolutize != false) path = Loader.absoluteUrl(path);
		return (Loader.Paths[thing] = path);
	},


	/** Return the list of files that `things` depend on.
		@param {String or String[]} Name or list of names of things to check.
		@returns {String[]} Absolute URLs of all files necessary to load things.
	*/
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

	/** Convert a special characters in URL paths.
		Converts `.`, `..`, and `//`.
		@param {String} url URL to convert.
		@returns {String} URL with special characters converted.
	*/
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
	/** Given named paths {eg: `{library}` in an URL to a normal path.
		@param {String} url URL which possibly has a named path in it.
		@returns {String} URL with named path expanded.
	*/
	expandNamedPath : function(url) {
		var match = url.match(Loader._namedPathMatcher);
		// if there is a package identifier in there, munge and continue
		if (match) {
			url = url.replace(Loader._namedPathMatcher, Loader.pathTo(match[1]));
		}
		return url;
	},

	_absoluteUrlCache : {},

	/** Convert the url to an absolute url (using the base location if provided).
		URL can have named paths in it, or can be a relative URL, or can be an absolute URL.
		@param {String} url Url to convert to an absolute URL.
		@param {String} [base] Base path to use if `url` is not already an absolute url.
				Defaults to `{document}`.
	*/
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

	/** Convert a list of URLs to absolute urls.
		@param {String[]} urls List of URLs to convert.
		@param {String} [base] Base URL.
		@returns {String[]} Returns list of absolute URLs.
		@see Loader.absoluteUrl
	*/
	absoluteUrls : function(urls, base) {
		if (typeof urls == "string") urls = [urls];

		return Array.map(urls, function(url) {
			return Loader.absoluteUrl(url, base);
		});
	},


	/** Get a cookie value for a particular key.
		@deprecated
	*/
	getCookie : function getCookie(key) {
		var cookies = document.cookie.split(/\s*;\s*/);
		for (var i = 0, len = cookies.length; i < len; i++) {
			var cookie = cookies[i].split("=");
			if (cookie[0] == key) return cookies[i].substr(key.length);
		}
	},

	/** @ignore */
	toString : function() {
		return "[Loader]";
	},

	//
	//	debugging shims
	//		these will be replace by Debuggable as soon as it loads (it's first)
	//		so we'll eat any messages until that shows up
	//

	/** @ignore */
	_debug : function() {},

	/** @ignore */
	_warn : function() {},

	/** @ignore */
	_error : function() {},
}



/** Load a single script file from a URL and execute callback when it finishes loading.
	@name Loader.loadScript
	@fucntion
	@param {String} url URL to load.
	@param {function} [callback] Method to execute when script finishes loading.
	@param {function} [errback] Method to execute if script cannot be loaded.
*/

/** Load a set of script files from a list of URLs.
	@name Loader.loadScripts
	@fucntion
	@param {String[]} urls URLs to load.
	@param {function} [callback] Method to execute when <b>all</b> scripts finish loading.
	@param {function} [errback] Method to execute if any script cannot be loaded.
*/
Loader.makeLoadable({
	type:"Script",
	extensions: ".js",
	defer : true,
	/** @ignore */
	load : function loadScript(url, callback, errback) {
//console.info("loadScript() ",url)
		url = Loader.absoluteUrl(url);
		if (callback) Loader.whenLoaded(url, callback);
		var script = document.createElement("script");
		/** @ignore */
		script.onload = function() {
			Loader._debug("loadScript(",url,"): done loading script.");
			Loader.onload(url, script);
		};
		script.setAttribute("src", url);
		if (errback) script.onerror = errback;
		(document.querySelector("head")||document.querySelector("html")).appendChild(script);

		return Loader.LOADING;	// indicate that we're current loading
	}
});


/** Load a single stylesheet file from a URL and execute callback when it finishes loading.
	@name Loader.loadStylesheet
	@fucntion
	@param {String} url URL to load.
*/

/** Load a set of stylesheet files from a list of URLs.
	@name Loader.loadStylesheets
	@fucntion
	@param {String[]} urls URLs to load.
*/
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








/**
	Breaks a URL up into pieces (much like window.location).
	@example var loc = new Location('http://www.server.com:81/path/to/a/file.xml?p1=v1&amp;p2=v2#hash');
	@class
	@constructor
	@param {String} url URL to convert into a location object.
*/
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
Location.prototype = {

	/** Full href: 
		@example http://www.server.com:81/path/to/a/file.xml?p1=v1&amp;p2=v2#hash
		@name Location#blarg
		@param {String} a Param 'a'.
		@function
		@returns {String}
	*/
	blarg : function(a,b,c) {},

	/** Full href: 
		@example http://www.server.com:81/path/to/a/file.xml?p1=v1&amp;p2=v2#hash
		@name Location#href
		@type String
	*/
	get href()		{ return "" + this.prefix + this.path + this.file + this.search + this.hash },


	/** Full path, including protocol and server: 
		@example http://www.server.com:81/path/to/a/
		@name Location#fullpath
		@type String
	*/
	get fullpath()	{ return "" + this.prefix + this.path },


	/** Protocol and server: 
		@example http://www.server.com:81
		@name Location#prefix
		@type String
	*/
	get prefix()	{ return this.match[2] || "" },


	/** Protocol (http or file, etc):  
		@example http:
		@name Location#protocol
		@type String
	*/
	get protocol()	{ return this.match[3] || "" },


	/** Hostname + port:  
		@example www.server.com:81
		@name Location#host
		@type String
	*/
	get host()		{ return this.match[4] || "" },


	/** Hostname without port:  
		@example www.server.com
		@name Location#hostname
		@type String
	*/
	get hostname()	{ return this.match[5] || "" },


	/** Port:  
		@example 81
		@name Location#port
		@type String
	*/
	get port()		{ return this.match[6] || "" },

	
	/** Path including file name: 
		@example /path/to/a/file.xml
		@name Location#pathname
		@type String
	*/
	get pathname()	{ return "" + this.path + this.file},

	
	/** Path without file name:  
		@example /path/to/a/
		@name Location#path
		@type String
	*/
	get path()		{ return this.match[7] || "" },

	
	/** Filename including extension: 
		@example file.xml
		@name Location#file
		@type String
	*/
	get file()		{ return this.match[8] || "" },

	
	/** Filename without extension: 
		@example file
		@name Location#filename
		@type String
	*/
	get filename()	{ return this.match[9] || "" },

	
	/** Extension (including the dot):  
		@ .xml
		@name Location#extension
		@type String
	*/
	get extension()	{ return this.match[10] || "" },

	/** Search string (including `?`): 
		@example ?p1=v1&amp;p2=v2
		@name Location#search
		@type String
	*/
	get search()	{ return this.match[11] || "" },

	/** Hash string (including `#`): 
		@example #hash
		@name Location#hash
		@type String
	*/
	get hash()		{ return this.match[12] || "" },

	/** Object of `paramName` -> `value` for each parameter: 
		@example {p1:"v1", p2:"v2"}
		@name Location#parameters
		@type Object
	*/
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

Location.Cache = {};
Location.urlParser = /(((?:(\w*:)\/\/)(([^\/:]*):?([^\/]*))?)?([^?]*\/)?)(([^?#.]*)(\.[^?#]*)|[^?#]*)(\?[^#]*)?(#.*)?/;



// using string.asLocation is more efficient than creating many location objects
//	as it only makes a single Location object per string
/* @name String#location
	Call `string.toLocation()` to convert any string into a Location object.
	You can call this efficiently on the same URL over and over.
*/
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
	/** Define Array.forEach if it has not been defined (eg: WebKit). 
		@see https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Array/forEach
	*/
	Array.forEach = function forEach(list, callback, context) {
		return Array.prototype.forEach.call(list, callback, context);
	}
	/** Define Array.map if it has not been defined (eg: WebKit). 
		@see https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Array/map
	*/
	Array.map = function map(list, callback, context) {
		return Array.prototype.map.call(list, callback, context);
	}
}


// Add a 'document.whenLoaded' handler to set up global page-level callbacks...
/** @ignore */
document.whenLoaded = function(handler) {
	Loader.whenLoaded("document", handler);
}
// ... and fire that event when the page finishes loading.
// 	DOMContentLoaded event fires when the browser is finished loading scripts
//	(but not necessarily images) in FF and later versions of WebKit.
/** @ignore */
document.addEventListener("DOMContentLoaded",
	function(){
		Loader.onload("document");
	}, false
);


// Initialize the Loader.  This will automatically load the {library}/hope package.
Loader.initialize();
