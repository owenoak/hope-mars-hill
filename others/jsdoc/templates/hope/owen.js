/** 
	Extensions to the JsDoc Toolkit parser by Owen Williams.
	These extensions are hereby placed in the public domain.
**/


//
// Monkey-patch "sortBy" onto all Arrays
//
/** Make a symbol sorter by some attribute. */
Array.prototype.sortBy = function sortBy(attribute) {
	function sorter(a, b) {
		if (a[attribute] != undefined && b[attribute] != undefined) {
			a = a[attribute].toLowerCase();
			b = b[attribute].toLowerCase();
			if (a < b) return -1;
			if (a > b) return 1;
			return 0;
		}
	}
	this.sort(sorter);
	return this;
}




//
// Monkey-patch a additional methods on the LOG object
//

LOG.print = function(msg) {
	if (JSDOC.opt.q) return;
	msg = "   "+msg;
	if (LOG.out) LOG.out.write(msg+"\n");
	else if (typeof LOG.verbose != "undefined" && LOG.verbose) print(msg);
}




//
// Monkey-patch additional methods on the IO object
//

/** Combine paths and file names together using the system slash 
	@param {String or File} ... String or File objects to combine into a single path.
*/
IO.concat = function concat() {
	var output = "";
	for (var i = 0; i < arguments.length - 1; i++) {
		var item = arguments[i];
		if (typeof item == "string") 	output += item;
		else							output += item.getPath();

		// make sure there is a trailing slash
		if (output.charAt(output.length-1) != SYS.slash) output += SYS.slash;
	}
	return output + arguments[arguments.length - 1];
}



/**
 * Make copyFile work with File objects as well as strings.
 * @param {String or File} inFile File to copy.
 * @param {String or File} outDir Directory to copy the file to.
 * @param {String} [fileName=The original filename] Name for file in outputDir.
 */
IO.copy = function copy(/**string*/ inFile, /**string*/ outDir, /**string*/ fileName) {
	if (typeof inFile == "string") inFile = new File(inFile);
	if (typeof outDir == "string") outDir = new File(outDir);
	if (fileName == null) fileName = inFile.getName();

	var outFile = new File(IO.concat(outDir, fileName));
	
	var inputStream = new Packages.java.io.BufferedInputStream(new Packages.java.io.FileInputStream(inFile), 4096);
	var outputStream = new Packages.java.io.BufferedOutputStream(new Packages.java.io.FileOutputStream(outFile), 4096);
	var nextChar;
	while ((nextChar = inputStream.read()) != -1) {
		outputStream.write(nextChar);
	}
	outputStream.close();
	inputStream.close();
}



/** Return a list of File objects for all files and directories underneath `dir`.
	Recurses up to 10 dirs deep.
	@param {String} dir Directory to search.
	@param {Boolean} filesOnly Pass true to skip directories in the output.
	@returns An array of Files for each file or directory.
*/
IO.listFiles = function listFiles(directory, filesOnly, _recurse, _outputList) {
	if (_outputList === undefined) { // initially
		_recurse = 9;
		_outputList = [];
		if (filesOnly === undefined) filesOnly = false;
	}
	if (_recurse == 0) return _outputList;

	if (typeof directory == "string") directory = new File(directory);
	if (!directory.isDirectory()) return [directory];
	

	var files = directory.listFiles();
	files.forEach(function(file) {
		if (file.getPath().match(/^\.[^\.\/\\]/)) return; // skip dot files

		// not worrying about recurse for now...  dangerous?
		if (file.isDirectory()) {
			if (!filesOnly) _outputList.push(file);
			IO.listFiles(file, filesOnly, _recurse-1, _outputList);
		} else {
			_outputList.push(file);
		}
	});

	return _outputList;
}


// copy all files in a directory to another directory
IO.copyDir = function copyDir(/**string*/ sourceDir, /**string*/ destDir) {
	LOG.inform("Copying directory:  "+sourceDir + "\n                  to:  "+destDir);

	if (typeof sourceDir == "string") sourceDir = new File(sourceDir);
	if (typeof destDir == "string") destDir = new File(destDir);

	try {
		var files = IO.listFiles(sourceDir);
		if (!destDir.exists()) destDir.mkdir();
		
		files.forEach(function(file) {
			var filepath = IO.concat(destDir, file.getPath().substr(sourceDir.getPath().length() + 1));
			if (file.isDirectory()) {
				LOG.print("      --> Creating directory:  " + filepath);
				file.mkdir();
			} else {
				LOG.print("      --> Copying file:        " + filepath);
				IO.copy(file, destDir);
			}
		});
	} catch (e) {
		LOG.warn("Error copying directory: "+e,e);
	}
	LOG.print("...done.");
}


// delete a file or an empty directory
IO.deleteFile = function deleteFile(/**string*/ path) {
	try {
		var result = (new File(path))["delete"]();
		if (result) {
			LOG.print("Deleted file: "+path);
		} else {
			LOG.warn("Could not delete "+path);
		}
	} catch (e) {
		LOG.warn("error deleting "+path, e);
	}
}


// delete a directory which may have files in it
IO.deleteDir = function deleteDir(/**string*/ directory) {
	if (typeof directory == "string") directory = new File(directory);
	
	LOG.inform("Deleting directory:  "+directory);
	var files = IO.listFiles(directory);

	// do a reverse sort so files come before the directories they live in
	// this will ensure that directories are empty when we try to delete them
	files.sort(function(a,b){return b > a});

	// delete each file and directory
	files.forEach(function(file) {
		LOG.print("      --> Deleting:  " + file.getPath());
		(new File(file))["delete"]();
	});

	// delete the top-level directory	
	LOG.print("      --> Deleting:  " + directory.getPath());
	directory["delete"]();
	LOG.print("...done.");
}


LOG.print("-------------------------------------------");
LOG.print("   B E G I N    O U T P U T    P H A S E  ");
LOG.print("-------------------------------------------");
