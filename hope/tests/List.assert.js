Assert({
	name : "ListLike:",
	setup : function() {},
	cleanup : function() {
		//delete window.list;
	},
	tests : {
		"new" : function(){
			window.list = new List();
			if (!list) Assert.fail("Could not create a new List");
			if (list.length != 0) Assert.fail("new list.length is "+list.length);
			if (!list.asIterable) Assert.fail("Could not create a new List");
		},
		"add to item 0" : function(){
			list.add("a", 0);
			if (list.length != 1) Assert.fail();
		},
		"add to item 1" : function(){
			list.add("b", 1);
			if (list[1] != "b") Assert.fail();
			if (list.length != 2) Assert.fail("Length is wrong after setting item[1]");
		},
		"add to item 5" : function(){
			list.add("f", 5);
			if (list[5] != "f") Assert.fail();
			if (list.length != 6) Assert.fail("Length is wrong after setting item[5]");
		},
		
		"clear first item" : function(){
			list.remove(null, 0);
			if (list[0] !== undefined) Assert.fail();
			if (list.length != 6) Assert.fail("Length was decremented");
		},
		
		"clear last item" : function() {
			list.remove(null, 5);
			if (list[5] !== undefined) Assert.fail();
			if (list.length != 5) Assert.fail("Length was not decremented");
		},

		"remove all" : function() {
			list.add("a", 1);
			list.removeList();
			if (list[1] !== undefined) Assert.fail("Item still exists");
			if (list.length != 0) Assert.fail("Length is not 0");
		}
	}
});
