/* TODO:
		- children should never have nulls or duplcates in it -- base on UniqueIterable?
		
*/

new Mixin({
	name : "Heirarchical",
	
	childConstructor : List,
	
	apply : function(constructor) {
		Iterable.apply(constructor, {
			itemName : "Child",
			unique : true,
			compact : true,
			getList : function() {	return this.children }
		});
		this.asMixin(constructor);
	},

	getDefaults : function(constructor, options) {
		if (!options) options = {};
		var childConstructor = options.childConstructor || Heirarchical.childConstructor;
		
		var methods = {
			initializeTree : function() {
				if (!this.children) this.children = new childConstructor();
			},
			
			add : function(child, index, inPlace, notify){
				if (!child) return;
				this.asIteratable(child, index, inPlace, notify);
				
				// remove child from old parent if it is not this
				if (child.parent && child.parent != this) child.orphan();
				child.parent = this;
				if (notify != false) this.notify("add"+Child, {child:child, index:index});
				return this;
			},

			remove : function(child, index, inPlace, notify){
				if (typeof index == "number" && this.children[index]) {
					return this.remove(this.children[index], null, inPlace, notify);
				}
				
				if (child.parent == this) child.orphan();
				this.children.remove(child, null, inPlace, notify);
				return this;
			},
			
			orphan : function() {
				if (this.parent) this.parent.remove(this);
				return this;
			},
			
			appendTo: function(parent) {
				if (parent) parent.append(this);
			},
			
			prependTo : function(parent) {
				if (parent) parent.prepend(this);
			},


			// containment
			
			/** Return list of all of our parents, with closest parent first */
			parents : function() {
				var parents = [], parent = this;
				while (parent = parent.parent) {
					parents.push(parent);
				}
				return parents;
			},
			
			/** @param {Boolean} checkAncestors If true, we return true if we're are a descendant */
			isChildOf : function(parent, checkAncestors) {
				if (checkAncestors != true) return (this.parent == parent);

				// check ancestors
				var ancestor = this;
				while (ancestor = ancestor.parent) {
					if (parent == ancestor) return true;
				}
				return false;
			},
			
			
			isParentOf : function(child, checkAncestors) {
				return child.isChildOf(this, checkAncestors);
			},
			
			
			
			
			/** @param {Function} selector  Pass a normal function to evaluate the function for each parent,
											or a Class (constructor) to return first parent of that class.
			 */										
			selectParent : function(selector, context) {
				return this.selectParents(selector, context, true);
			},
			
			
			/** @param {Function} selector  Pass a normal function to evaluate the function for each parent,
											or a Class (constructor) to return parent of that class.
			 */										
			selectParents : function(selector, context, _returnFirst) {
				if (typeof selector != "function") {
					throw this + (_returnFirst ? "selectParents" : "selectParent")
							+ ": selector must be a function";
				}

				var parents = [], parent = this, result
					isAClass = selector.asClass
				;
				while (parent = parent.parent) {
					if (isAClass) {
						result = (parent.constructor == selector);
					} else {
						result = !!(selector.call(context, parent));
					}
					if (!result) continue;
					
					if (_returnFirst) {
						return parent;
					} else {
						parents.push(parent);
					}
				}
				return parents;
			}
			
		}
		
		return methods;
	}

});

