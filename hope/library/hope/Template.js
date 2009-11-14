new Class({
	name : "Template",
	collection : "Templates",
	
	// initialize the class
	initialize : function() {

	},

	defaults : {
		initialize : function(props, text) {
			this.set(props);
			if (text) this.text = text;
		},
		
		// the first time the Template is expanded
		//	we replace the "expand" function with a custom expander function
		expand : function(context) {
			if (this.expand) this.expand = this.makeExpander();
			return this.expand(context);
		},

		// make an expander function for evaluating the template
		makeExpander : function() {
			var indent = "",
				chopped = this.text.chop(/([#@]\{\?*|<#>)/g, /(<\/#>|\})/g),
				script = [];
			;
			
			// TODO: move this into non-inlined function for speed?
			chopped.forEach(function(next) {
				if (typeof next == "string") {
					script.push("output += \"" + next.makeDoubleQuoteSafe() + "\";");
					return;
				}
				
				// handle  <#>...</#>
				if (next.start[0] == "<#>") {
					script.push(next.middle);
				}
				
				else {

					// handle ternary operators  #{?  ... ? ... : ... }
					//	TODO: some sort of contexting in second/third parts of ternary?
					if (next.start[0] == "#{?") {
						script.push("output += "+next.middle+";");
					}
				
					// output attributes if they are not empty
					else if (next.start[0] == "@{") {
						if (next.middle == "events") {
console.warn(this,".makeExpander(): event handlers not working yet");
							script.push("if (it.outputEventHandlers) output += it.outputEventHandlers();");
						} else {
							script.push(
								"if ((value = "+next.middle+") != null && value != '')"
									+" output += '"
											+ (next.middle.toLowerCase() == "classname" ? "class" : next.middle)
										+"=\"' + value + '\"';"
							);
						}

					// handle  #{...}
					// doing a try/catch for now, may want to reconsider for speed
					//
					// TODO: we can avoid try..catch if there's no dots in the middle
					//			or not a function
					} else {
						// only output try...catch if it's a complex expression
						var complex = (next.middle.indexOf(".") > 3 || next.middle.indexOf("(") > -1); 
						script.push(
							(complex ? "try {" : "")
								+ "if ((value = "+next.middle+") != null) output += value;"
							+ (complex ? "} catch(e){}" : "")
						);
					}
				}
			});
			
			script = [
				"	it = it || {};",
				"	var value;",
				"	try {",
				"		var output = '';",
				"		"+script.join("\n		"+indent),
//				"	console.warn(output);",
				"		return output;",
				"	} catch (e) {",
				"		console.error('error expanding \""+this.name+"\":' + e.message);",
				"		return '';",
				"	}",
			].join("\n"+(indent||""));

//console.info(script);
			return new Function("it", script);
		},
		
		toElement : function(context) {
			return this.expand(context).toElement();
		},

		toElements : function(context) {
			return this.expand(context).toElements();
		}
	},
	
	classDefaults : {
		// 	Load one or more templates from a URL.
		//	Use Loader.loadTemplate() and Loader.loadTemplates() instead of this
		//		unless you know what you're doing.
		//
		// 	NOTE: url is assumed to be an absolute url
		//
		//	NOTE: throws an error if the file couldn't be loaded
		//			or there was an error parsing the templates
		load : function(url) {
			// NOTE: this will throw an exception if the file can't be found
			var text = Loader.loadText(url, false, null, null, "Template.load("+url+")");
	
			// TOOD: the automatic id bit is a bit wacky
			var id = url.toLocation().filename;
			return Template.fromString(text, id, "from file "+url);
		},
		
		// create one or more Template objects from a string
		fromString : function(text, id, hint) {
			// if there are a bunch of templates in the string, create a Template from each
			if (text.contains("<template")) {
				var templates = [];
				
				text.forEachTag("template", function(tagName, attrs, contents) {
					attrs = attrs.getAttributes();
					attrs.hint = hint;
					templates.push(new Template(attrs, contents));
				});
				return templates;
			}

			// otherwise if the entire string is just one template
			else {
				return new Template({id:id, hint:hint}, text);
			}
		}
	}

});

Loader.makeLoadable({
	type:"Template", 
	extensions: [".template", ".templates"], 
	load : Template.load
});