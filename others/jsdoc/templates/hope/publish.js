/** Called automatically by JsDoc Toolkit. */
function publish(symbolSet) {
	var config = publish.conf = {  // trailing slash expected for dirs
		ext				: ".html",
		outDir			: JSDOC.opt.d || SYS.pwd+"../out/jsdoc/",
		templatesDir	: JSDOC.opt.t || SYS.pwd+"../templates/jsdoc/",
		symbolsDir		: "symbols/",
		srcDir			: "symbols/src/"
		
	};
	config.indexTemplate	= IO.concat(config.templatesDir, "index.tmpl");
	config.classTemplate	= IO.concat(config.templatesDir, "class2.tmpl");
	config.classesTemplate	= IO.concat(config.templatesDir, "allclasses.tmpl");
	config.fileIndexTemplate= IO.concat(config.templatesDir, "allfiles.tmpl")

	
	// is source output is suppressed, just display the links to the source file
	if (JSDOC.opt.s && defined(Link) && Link.prototype._makeSrcLink) {
		Link.prototype._makeSrcLink = function(srcFilePath) {
			return "&lt;"+srcFilePath+"&gt;";
		}
	}

	// delete the output directory (to get rid of any old stuff in there)
	IO.deleteDir(config.outDir);
	
	// create the folders and subfolders to hold the output
	IO.mkPath(config.outDir + config.srcDir);

	// copy the template 'include' directory directly into the output dir
	IO.copyDir(config.templatesDir + "include", config.outDir);

	// used to allow Link to check the details of things being linked to
	Link.symbolSet = symbolSet;

	// create the required templates
	try {
		var classTemplate = new JSDOC.JsPlate(config.classTemplate);
		var fileindexTemplate = new JSDOC.JsPlate(config.fileIndexTemplate);
		var classesTemplate = new JSDOC.JsPlate(config.classesTemplate);
		var classesindexTemplate = new JSDOC.JsPlate(config.indexTemplate);
	}
	catch(e) {
		LOG.warn("Couldn't create the required templates: "+e);
		quit();
	}
	
	// some utility filters
	function hasNoParent(it) {return (it.memberOf == "")}
	function isaClass(it) {return (it.is("CONSTRUCTOR") || it.isNamespace)}
	
	// get an array version of the symbolset, useful for filtering
	var symbols = symbolSet.toArray();
	
 	// get a list of all the classes in the symbolset
 	var classes = symbols.filter(isaClass).sortBy("alias");

	// srcFiles is the full list of source files we've processed
	var srcFiles = JSDOC.opt.srcFiles;

	
	// create a filemap in which outfiles must be to be named uniquely, ignoring case
	if (JSDOC.opt.u) {
		var filemapCounts = {};
		Link.filemap = {};
		for (var i = 0, l = classes.length; i < l; i++) {
			var lcAlias = classes[i].alias.toLowerCase();
			
			if (!filemapCounts[lcAlias]) filemapCounts[lcAlias] = 1;
			else filemapCounts[lcAlias]++;
			
			Link.filemap[classes[i].alias] = 
				(filemapCounts[lcAlias] > 1)?
				lcAlias+"_"+filemapCounts[lcAlias] : lcAlias;
		}
	}
	
	// create a class index, displayed in the left-hand column of every class page
	Link.base = "../";
 	publish.classesIndex = classesTemplate.process(classes); // kept in memory
	
	// create each of the class pages
	LOG.inform("Writing pages for each class:");
	for (var i = 0, l = classes.length; i < l; i++) {
		var symbol = classes[i];
		
		symbol.events = symbol.getEvents();   // 1 order matters
		symbol.methods = symbol.getMethods(); // 2
		
		var output = "";
		output = classTemplate.process(symbol);
		
		LOG.print("      --> Writing page for class: "+symbol.alias);
		IO.saveFile(config.outDir + config.symbolsDir, 
			((JSDOC.opt.u)? Link.filemap[symbol.alias] : symbol.alias) + config.ext, output);
	}
	LOG.print("...done.");
	
	// regenerate the index with different relative links, used in the index pages
	Link.base = "";
	publish.classesIndex = classesTemplate.process(classes);
	
	// create the class index page
	LOG.inform("Writing class index:");
	var classesIndex = classesindexTemplate.process(classes);
	IO.saveFile(config.outDir, "index"+config.ext, classesIndex);
	classesindexTemplate = classesIndex = classes = null;
	LOG.print("...done.");
	
	// output the file index page
	LOG.inform("Writing file index:");
	var allFiles = getFileIndexFiles(symbols, srcFiles);
	var filesIndex = fileindexTemplate.process(allFiles);
	IO.saveFile(config.outDir, "files"+config.ext, filesIndex);
	LOG.print("...done.");


	// output the source files
	LOG.inform("Writing source files:");
 	for (var i = 0, l = srcFiles.length; i < l; i++) {
 		var file = srcFiles[i];
		makeSrcFile(file, config.outDir + config.srcDir);
 	}
	LOG.print("...done.");

}


/** Return the list of files for the file index */
function getFileIndexFiles(symbols, srcFiles) {
	function isaFile(it) {return (it.is("FILE"))}

	var documentedFiles = symbols.filter(isaFile); // files that have file-level docs
	var allFiles = []; // not all files have file-level docs, but we need to list every one
	
	srcFiles.forEach(function(file) {
		allFiles.push(new JSDOC.Symbol(file, [], "FILE", new JSDOC.DocComment("/** */")));
	});
	
	documentedFiles.forEach(function(file) {
		var offset = srcFiles.indexOf(file.alias);
		allFiles[offset] = documentedFiles[i];
	});
		
	allFiles = allFiles.sortBy("name");
	return allFiles;
}


/** Just the first sentence (up to a full stop). Should not break on dotted variable names. */
function summarize(desc) {
	if (typeof desc != "undefined")
		return desc.match(/([\w\W]+?\.)[^a-z0-9_$]/i)? RegExp.$1 : desc;
}

/** Statically pull in the contents of an external file at the given path. */
function include(path) {
	var path = publish.conf.templatesDir+path;
	return IO.readFile(path);
}

/** Evaluate an external file at the given path as a template. */
function template(path, symbol) {
	var theTemplate = new JSDOC.JsPlate(publish.conf.templatesDir + path);
	return theTemplate.process(symbol);
}


/**

/** Turn a raw source file into a code-hilited page in the docs. */
function makeSrcFile(path, srcDir, name) {
	if (JSDOC.opt.s) return;
	
	if (!name) {
		name = path.replace(/\.\.?[\\\/]/g, "").replace(/[\\\/]/g, "_");
		name = name.replace(/\:/g, "_");
	}

	LOG.print("      --> Writing source file: "+ name);
	
	var src = {path: path, name:name, charset: IO.encoding, hilited: ""};
	
	if (defined(JSDOC.PluginManager)) {
		JSDOC.PluginManager.run("onPublishSrc", src);
	}

	if (src.hilited) {
		IO.saveFile(srcDir, name+publish.conf.ext, src.hilited);
	}
}


/** Build output for displaying function parameters. */
function makeSignature(params) {
	if (!params) return "()";
	var signature = "("
	+
	params.filter(
		function(it) {
			return it.name.indexOf(".") == -1; // don't show config params in signature
		}
	).map(
		function(it) {
			return it.name;
		}
	).join(", ")
	+
	")";
	return signature;
}

/** Find symbol {@link ...} strings in text and turn into html links */
function resolveLinks(str, from) {
	str = str.replace(/\{@link ([^} ]+) ?\}/gi,
		function(match, symbolName) {
			return new Link().toSymbol(symbolName);
		}
	);
	
	return str;
}




// load Owen's extensions
load(JSDOC.opt.t+"owen.js");


