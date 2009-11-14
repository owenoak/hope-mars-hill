/*	
	Quick and dirty transparent notifier thinger 
	
	TODO: make notifier div more responsive to the width of the text?

*/

window.Notifier = {
	displayDuration : 2000,
	element : create("div", {id:"Notifier", parent:"BODY"}).hide(),
	show : function() {
		// concatenate all arguments together as message to show
		var msg = map(arguments, function(it){return it}).join(" ");
		Notifier.element.innerHTML = msg;
		Notifier.element.fadeIn();
		setTimeout(Notifier.hide, this.displayDuration);
	},
	hide : function() {
		Notifier.element.fadeOut();
	}
}


function notify() {
	Notifier.show.apply(Notifier, arguments);
}