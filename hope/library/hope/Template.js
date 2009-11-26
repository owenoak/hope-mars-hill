new Class({
	name : "Template",
	collection : "Templates",

	// initialize the class
	initialize : function() {

	},

	defaults : {
		args : "it",			// name of the argument(s) in the expander function

		initialize : function(props, text) {
			if (arguments.length == 1 && typeof arguments[0] == "string") {
				this.text = arguments[0];
			} else {
				this.set(props);
				if (text) this.text = text;
			}
			this.makeGloballyAddressable();
		},

		// the first time the Template is expanded
		//	we replace the "expand" function with a custom expander function
		//	and then call the expander function
		expand : function() {
			this.expand = this.makeExpander();
			return this.expand.apply(this, arguments);
		},

		// make an expander function for evaluating the template
		makeExpander : function() {
			var args = this.args,
				firstArg = args.split(/\s*,\s*/)[0],
				indent = "",
				chopped = this.text.chop(/(<<@?|<#>)/g, /(<\/#>|>>)/g),
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
					script.push("try {");
					script.push(next.middle);
					script.push("} catch (e) {}");
				}

				else {
					// output attributes if they are not empty
					if (next.start[0] == "<<@") {
						script.push("try { ");
						
						if (next.middle == "events") {
							script.push("output += arguments[0].getEventAttributes();");
						} else {
							script.push("__value = arguments[0]."+next.middle+";"
									+ "if (__value != null && value != '') {"
										+" output += ' "+next.middle+"=\"' + __value + '\"';"
									+ "}");
						}
						script.push(
							"} catch(e){ __value = null;};"
						);

					// handle  #{...}
					// doing a try/catch for now, may want to reconsider for speed
					//
					} else {
						script.push(
							"try { output += ((__value = ("+next.middle+")) != null ? __value : '') } catch (e){}"
//								"try { __value = ("+next.middle+") } catch(e){ __value = null;};",
//								"if (__value != null) output += __value; "
						);
					}
				}
			});

			script = [
				"	"+firstArg+" = "+firstArg+" || {};",
				"	var __value, output = output || '';",
				"	try {",
				"		"+script.join("\n		"+indent),
//				"	console.warn(output);",
				"	} catch (e) {",
				"		console.error('error expanding template \""+this.id+"\":' + e.message);",
				"	}",
				"	return output;",
			].join("\n"+(indent||""));

			return new Function(args, script);
		},

		toElement : function() {
			return this.expand.apply(this, arguments).toElement();
		},

		toElements : function(context) {
			return this.expand.apply(this, arguments).toElements();
		}
	},

	classDefaults : {
		get : function(template) {
			if (template instanceof Template) return template;
			return Templates[template];
		},
		
		
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
		},

		// expand the specified template with arguments 1..n
		expand : function(templateId) {
			var template = Template.get(templateId);
			if (!template) {
				Template._debug(".expand(",templateId,"): template not found");
				return "";
			}
			var args = Array.splice(arguments, 0, 1);
			return template.expand.apply(template, args);
		},

		toElement : function(templateId) {
			var results = Template.expand.apply(Template, arguments);
			if (results) return results.toElement();
		},

		toElements : function(templateId) {
			var results = Template.expand.apply(Template, arguments);
			if (results) return results.toElements();
		}
	}

});

Debuggable.applyTo(Template);

Loader.makeLoadable({
	type:"Template",
	extensions: [".template", ".templates"],
	load : Template.load
});
