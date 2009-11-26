/*
function Animal(props) {
	this.extend(props);
	this.animalConstructorCalled = true;
}
Animal.isNotAVegetable = true;
Animal.prototype = {
	extend : function(props) {
		if (!props) return;
		for (var name in props) {
			this[name] = props[name];
		}
	},
	
	Animal : function(methodName, args) {
		if (arguments.length < 2) {		// constructor call
			return Animal.apply(this, arguments[0]);
		} else {						// normal method call
			return Animal.prototype[methodName].apply(this, args);
		}
	},
	
	say : function(msg) {
		console.warn("Animal says: "+msg);
	}
}

function Mammal(props) {
	this.Animal(arguments);
	this.mammalConstructorCalled = true;
}
Mammal.prototype = new Animal(
	{
		Mammal : function(methodName, args) {
			if (arguments.length < 2) {		// constructor call
				return Mammal.apply(this, arguments[0]);
			} else {						// normal method call
				return Mammal.prototype[methodName].apply(this, args);
			}
		},
		
		say : function(msg) {
			console.warn("Mammal says: " + msg);
			this.Animal("say",arguments);
		}
	}
);
Mammal.__proto__ = Animal;


function Camel(props) {
	this.Mammal(arguments);
	this.camelConstructorCalled = true;
}
Camel.prototype = new Mammal(
	{
		Camel : function(methodName, args) {
			if (arguments.length < 2) {		// constructor call
				return Camel.apply(this, arguments);
			} else {						// normal method call
				return Camel.prototype[methodName].apply(this, args);
			}
		},
		
		say : function(msg) {
			console.warn("Camel says: "+ msg);
			this.Mammal("say", arguments);
		}
	}
);
Camel.__proto__ = Mammal;

var animal = new Animal({name:"animal"});
var mammal = new Mammal({name:"mammal"});
var camel = new Camel({name:"camel"});
*/

/* working:

// class creator syntax implementing the above
function Class(attributes) {
	var constructor = function(props) {
		// TODO: this should really call initialize() rather than inlining
		//			but maybe we extend() first???
		if (SuperClass) 	SuperClass.apply(this, arguments);
		else				this.extend(props);
	}
	constructor.className = className;
	if (SuperClass) {
		constructor.prototype = new SuperClass(instanceProps);
		constructor.__proto__ = SuperClass;
		constructor.SuperClass = SuperClass;
	} else {
		constructor.prototype = instanceProps;
		constructor.prototype.extend = function(props) {
			if (!props) return;
			for (var name in props) {
				this[name] = props[name];
			}
		}
	}
	constructor.prototype[className] = function(methodName, args) {
		// NOTE: this special constructor thing is only needed
		//			if we don't have the initialize() pattern for constructing
		if (arguments.length < 2) {		// constructor call
			return constructor.apply(this, arguments);
		} else {						// normal method call
			return constructor.prototype[methodName].apply(this, args);
		}
	}
	window[className] = constructor;
}
*/