Assert({
	name : "Iterable:",
	setup : function() {},
	cleanup : function() {
		//delete window.list;
	},
	tests : {
		"new" : function(){
			window.list = new List();
			if (!list) Assert.fail("Could not create a new List");
			if (list.length != 0) Assert.fail("new list.length is "+list.length);
			if (!list.iterable) Assert.fail("Could not create a new List");
		},
		"add to item 0" : function(){
			list.setItem(0, "a");
			if (list.length != 1) Assert.fail();
		},
		"add to item 1" : function(){
			list.setItem(1, "b");
			if (list[1] != "b") Assert.fail();
			if (list.length != 2) Assert.fail("Length is wrong after setting item[1]");
		},
		"add to item 5" : function(){
			list.setItem(5, "f");
			if (list[5] != "f") Assert.fail();
			if (list.length != 6) Assert.fail("Length is wrong after setting item[5]");
		},
		
		"clear first item" : function(){
			list.clearItem(0);
			if (list[0] !== undefined) Assert.fail();
			if (list.length != 6) Assert.fail("Length was decremented");
		},
		
		"clear last item" : function() {
			list.clearItem(5);
			if (list[5] !== undefined) Assert.fail();
			if (list.length != 5) Assert.fail("Length was not decremented");
		},

		"clear" : function() {
			list.setItem(1, "a");
			list.clear();
			if (list[1] !== undefined) Assert.fail("Item still exists");
			if (list.length != 0) Assert.fail("Length is not 0");
		}
	}
});
