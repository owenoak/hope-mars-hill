// ::
// ::  Package
// ::
// NOTE: don't instantiate packages directly, use Loader.loadPackage() instead
//	- loads a 'manifest' file which defines a number of files to be loaded


new Class({
	name : "Package",
//	collection : "Packages",
	
	defaults : {
		initialize : function(properties) {
			this.set(properties);
			console.warn("creating package ", this);
			Loader.Paths[this.name] = this.path;
			Loader.setLoadResult("package:"+this.name, this);
		}
	},
		
	classDefaults : {
		// given a path to a package, return the package file name
		getUrl : function(path) {
			path = Loader.absoluteUrl(path, "{base}");
			var pkgName = path.toLocation().file;
			return path + "/" + pkgName + ".package.xml";
		},
		
		// loading a package:
		//		- first get the xml file and parse into an object
		//		- if it has files, load those and create the package when done
		//		- if no files, create the package immediately
		load : function loadPackage(url, callback, errback, xml) {
			Loader._debug("loadPackage(",url,"): beginning load");
			if (!xml) xml = Loader.loadXML(url, false);
			var props = Package.XMLManifestToJS(xml);
	
			function makePackage() {
				var pkg = new Package(props);
				pkg.xml = xml;
				if (callback) callback();
				Loader._debug("loadPackage(",url,"): package load completed");
			}
	
			var files = Loader.absoluteUrls(props.files, url.toLocation().fullpath);
			Loader.loadFiles(files, makePackage);
	
			return xml;
		},
		
		// convert an XML manifest to a JS object
		XMLManifestToJS : function (document) {
			var object = {
				name : document.firstChild.getAttribute("name"),
				files : Array.map(document.querySelectorAll("[url]"),
								function(entry) {
									var js = {};
									Array.forEach(entry.attributes, function(attr) {
										js[attr.name] = attr.value;
									});
									return js;
								}
							)
			}
			return object;
		}
	}
});


Loader.makeLoadable({
	type:"Package", 
	defer:true, 
	getUrl : Package.getUrl,
	load : Package.load
});


