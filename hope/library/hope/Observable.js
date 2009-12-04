/** Create a mixin for the observable pattern.
	The methods for this are defined in Class.js, and are automatically added to all classes.
  */
new Mixin({
	name : "Observable",
	defaults : {
		observe : Class.prototype.observe,
		notify : Class.prototype.notify
	}
});

