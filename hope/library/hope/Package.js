// ::
// ::  Package
// ::
// NOTE: don't instantiate packages directly, use Loader.loadPackage() instead
//	- loads a 'manifest' file which defines a number of files to be loaded


new Class({
	name : "Package",
//	collection : "Packages",

	defaults : {
		name : undefined,

		initialize : function(properties) {
			this.extend(properties);
			var packageName = "package:"+this.name;

			// remember the path to this package
			if (this.path) Loader.setPath(packageName, this.path);

			// and call any onload handlers for the package
			Loader.onload(packageName, this);
		}
	},

	classDefaults : {
		// given a path to a package, return the package file name
		getUrl : function(path) {
			path = Loader.absoluteUrl(path, "{hope}");
			var pkgName = path.toLocation().file;
			return path + "/" + pkgName + ".package.xml";
		},

		// loading a package:
		//		- first get the xml file and parse into an object
		//		- if it has files, load those and create the package when done
		//		- if no files, create the package immediately
		load : function loadPackage(url, callback, errback, xml) {
			Loader._warn("loadPackage(",url,"): beginning package load");
			if (!xml) xml = Loader.loadXML(url, false);
			var props = Package.XMLManifestToJS(xml);
			props.xml = xml;
			props.path = Loader.absoluteUrl(url.toLocation().fullpath);

			function makePackage() {
				var pkg = new Package(props);
				Loader._debug("loadPackage(",url,"): package load completed");
				if (callback) callback();
			}

			var files = Loader.absoluteUrls(props.files, url.toLocation().fullpath);
			Loader.loadFiles(files, makePackage);

			return xml;
		},

		// convert an XML manifest to a JS object
		XMLManifestToJS : function (document) {
			var object = {
				name : document.firstChild.getAttribute("name"),
				files : []
			};
			
			Array.forEach(document.querySelectorAll("[url]"),
				function(entry) {
					var js = {};
					Array.forEach(entry.attributes, function(attr) {
						js[attr.name] = attr.value;
					});
					object.files.push(js);
				}
			);
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


