/*
	TODO:
		* not overflowing properly when resizing smaller
		* add sort parameter (name or type)
		* re-use old panels so no flash
		* put name of last selected thing into text field
		* animate scroll to right when selecting new thing if necessary
			- add "scrollTo(x,y[,duration])" method to element
			- scrollTo can take "left","right","top","bottom"  ( scrollTo("topleft") )
		* moveable/resizable
		* console.inspect not working
		* keep shadows?  they slow fade down considerably
		* loadPackage() should return instantly if already loaded
		* remember showInherited/showMethods in a cookie

*/



window.Inspector = {
	id : "Inspector",

	targets : [],
	panels : [],

	showInherited : true,
	showMethods : false,
	visible : false,
	
//	template : Loader.loadText("{library}Inspector/Inspector.template"),	
	
	draw : function() {
		this.element = Templates.get("Inspector").toElement(this);
		this.element.animationSteps = 3;
		this.element.animationDuration = 100;
		document.body.add(this.element);
		this.display = this.element.select("#InspectorDisplay");
/*
		var inputs = this.element.selectAll("input");
		inputs.forEach(function(input) {
			var name = input.getAttribute("name");
			if (name == "showInherited") input.checked = this.showInherited;
			if (name == "showMethods") input.checked = this.showMethods;
		}, this);
*/
		this.element.fadeIn();
	},

	refresh : function() {
		var targets = this.targets.clone();
		targets.forEach(function(target, i) {
			this.inspect(target, i);
		}, this);
	},

	show : function () {
		if (!this.element) this.draw();
		else this.element.fadeIn();
		this.visible = true;
	},
	
	hide : function() {
		if (this.element) this.element.fadeOut();
		this.visible = false;
	},
	
	
	itemClick : function(targetNum, key, element) {
		var parent = this.targets[targetNum],
			target = parent[key]
		;
		this.inspect(target, targetNum+1);

		// highlight the current item
		var panel = this.getPanel(targetNum);
		panel.selectAll("div").invoke("removeClass", ["selected"]);
		
		element.addClass("selected");
	},
	
	getPanel : function(num) {
		return this.display.children[num];
	},
	
	inspect : function(it, panelNum) {
		if (!this.visible) this.show();

		if (typeof it == "string") {
			try {
				it = eval(it);
			} catch (e) {
				return this.outputPanel(["Error: can't evaluate '"+it+"'"], "StringPanel");
			}
		}

		if (!panelNum) panelNum = 0;
		
		// remove old panels
		var parent = this.element.select("#InspectorDisplay");
		for (var i = parent.children.length; i > panelNum; i--) {
			parent.removeChild(parent.children[i-1]);
		}

		this.targets.length = this.panels.length = panelNum;
		this.targets.push(it);
		
		var type = this.getType(it);
		try {
			switch (type) {
				case "Element": 	return this.inspectElement(it);
				case "Class": 		return this.inspectClass(it);
				case "Array": 		return this.inspectArray(it);		// TODO: nodeList ?
				case "Function": 	return this.inspectFunction(it);
				case "String": 		return this.inspectString(it);
				case "Number":		return this.inspectNumber(it);
				case "Boolean":		return this.inspectBoolean(it);
	
				case "Window":
				default:			return this.inspectObject(it);
			}
		} catch (e) {
			notify("couldn't show that!");
		}
	},
	
	
	inspectObject : function(it) {
		var output = [];
		for (var prop in it) {
			var value = it[prop];
			if (typeof value == "function" && !this.showMethods) continue;
			var inherited = !it.hasOwnProperty(prop);
			if (Inspector.showInherited == false && inherited) continue;

			var type = this.getType(value);
			output.push(this.outputItem(type, prop, it[prop], inherited));
		}

		output = output.sort();

		this.outputPanel(output, "ObjectPanel");
	},
	
	inspectClass : function(it) {
		this.inspectObject(it, "ClassPanel");
	},
	
	inspectArray : function(it) {
		// output numbered items
		var output = [];
		for (var i = 0; i < it.length; i++) {
			var value = it[i];
			if (typeof value == "function" && !this.showMethods) continue;
			var type = this.getType(value);
			output.push(this.outputItem(type, i, value, false));
		}
		
		// output properties
		for (var prop in it) {
			// skip number strings
			if (!isNaN(parseInt(prop))) continue;
			if (typeof prop == "number") continue;
			var value = it[prop];
			if (typeof value == "function" && !this.showMethods) continue;
			var inherited = !it.hasOwnProperty(prop);
			if (Inspector.showInherited == false && inherited) continue;
			var type = this.getType(value);
			output.push(this.outputItem(type, prop, value, inherited));
		}
		this.outputPanel(output, "ArrayPanel");
	},
	
	inspectElement : function(it) {
		this.inspectObject(it, "ElementPanel");	
	},
	
	inspectFunction : function(it) {
		this.outputPanel([it], "FunctionPanel");
	},

	inspectString : function(it) {
		this.outputPanel([it.makeHTMLSafe()], "StringPanel");
	},
	
	inspectNumber : function(it) {
		this.outputPanel([it], "NumberPanel");
	},
	
	inspectBoolean : function(it) {
		this.outputPanel([it], "BooleanPanel");
	},
	

	// utility
	getType : function(it) {
		if 		(it instanceof Element) 	return "Element";
		else if (it instanceof Array) 		return "Array";
		else if (it instanceof Class)		return "Class";
		else if (it instanceof Function) 	return "Function";
		else if (it instanceof String  || typeof it == "string") 		return "String";
		else if (it instanceof Number  || typeof it == "number")		return "Number";
		else if (it instanceof Boolean || typeof it == "boolean")		return "Boolean";
		else if (it instanceof Window)		return "Object";
		return "Object";
	},
	
	outputPanel : function(items, className) {
		className = "Panel"+ (className ? " "+className : "");
		var panel = create("div", {
									className:className, 
									panelNum:(this.targets.length-1),
									html : "<div class='PanelBody'>"+items.join("\n")+"</div>",
									parent : select("#InspectorDisplay")
								}
						);
	},
	
	outputItem : function(type, prop, value, inherited) {
		var className = "Thing " + type + (inherited ? " Inherited" : ""),
			click = "onclick='Inspector.itemClick("+(this.targets.length-1)+",\""+prop+"\", this)'"
		;

		if (type == "Array") value = "(length "+value.length+")";
		else if (type == "String") value = value.makeHTMLSafe();
		else value = ""+value;
		
		return "<div sort='"+(""+prop).toLowerCase()+"' class='"+className+"' "+click+">\
					<span class='name'>"+prop+"</span>:\
					<span class='value'>"+value+"</span>\
				</div>";
	}

};

window.inspect = console.inspect = function inspect(it) {
	Inspector.inspect(it);
}


Inspector.inspect(window);
