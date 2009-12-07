/* TODO:
		- notification for parent events?
		
*/

new Class({
	name : "Tree2",
	Super : "List2",
	
	options : extend({}, ListLike.options),

	// assign the options to the prototype
	mixinTo : function mixinTo(constructor, options) {
		options = extend(options || {}, this.options, false);
		this.asList(constructor, options);
	},
	
	defaults : {
		options : extend({}, List.prototype.options),

		// if the child's parent is changing, reassign the parent
		setItem : function(index, child, notify) {
			if (child && child.parent != this && child.setParent) child.setParent(this);
			return this.asList(index, child, notify);
		},

		// clear the child's parent
		removeItem : function(index, notify) {
			var child = this[index];
			if (child && child.parent == this && child.setParent) child.setParent(null);
			return this.asList(index, notify);
		},

		// simply set the parent of the child
		// note: you should probably call add() rather than setParent unless you know what you're doing
		setParent : function setParent(parent, remove) {
			if (remove != false && this.parent) this.parent.remove(this);
			this.parent = parent;
			return this;
		},
		
		appendTo: function appendTo(parent, notify) {
			if (parent) parent.append(this, notify);
		},
		
		prependTo : function prependTo(parent, notify) {
			if (parent) parent.prepend(this, notify);
		},


		// containment
		
		/** Return list of all of our parents, with closest parent first */
		parents : function parents() {
			var parents = [], parent = this;
			while (parent = parent.parent) {
				parents.push(parent);
			}
			return parents;
		},
		
		/** @param {Boolean} checkAncestors If true, we return true if we're are a descendant */
		isChildOf : function isChildOf(parent, checkAncestors) {
			if (checkAncestors != true) return (this.parent == parent);

			// check ancestors
			var ancestor = this;
			while (ancestor = ancestor.parent) {
				if (parent == ancestor) return true;
			}
			return false;
		},
		
		
		isParentOf : function isParentOf(child, checkAncestors) {
			return child.isChildOf(this, checkAncestors);
		},
		
		
		
		
		/** @param {Function} selector  Pass a normal function to evaluate the function for each parent,
										or a Class (constructor) to return first parent of that class.
		 */										
		selectParent : function selectParent(selector, context) {
			return this.selectParents(selector, context, true);
		},
		
		
		/** @param {Function} selector  Pass a normal function to evaluate the function for each parent,
										or a Class (constructor) to return parent of that class.
		 */										
		selectParents : function selectParents(selector, context, _returnFirst) {
			if (typeof selector != "function") {
				throw this + (_returnFirst ? "selectParents" : "selectParent")
						+ ": selector must be a function";
			}

			var parents = [], parent = this, result;
			
			if (selector.asClass) {
				var Class = selector;
				while (parent = parent.parent) {
					if (!parent instanceof Class) continue;
					if (_returnFirst) {
						return parent;
					} else {
						parents.push(parent);
					}
				}
			} else {
				if (!context) context = this;
				while (parent = parent.parent) {
					if (!(selector.call(context, parent))) continue;
					
					if (_returnFirst) {
						return parent;
					} else {
						parents.push(parent);
					}
				}
			}
			return parents;
		}
		
	}

});


// set Tree up as a mixin
Mixins.add("Tree", Tree);
