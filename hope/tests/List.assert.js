Assert({
	name : "List",
	start : function() {
		window.list = new List();
	},
	end : function() {
		//delete window.list;
	},
	tests : {
		"new" : function(){
			if (!list) Assert.fail("Could not create a new List");
			if (list.length != 0) Assert.fail("new list.length is "+list.length);
		},
		
		"asList" : function(){
			if (!list.asList) Assert.fail("List.asList is not defined");
		},

		"equals empty" : function() {
			if (!list.equals()) Assert.fail();
			if (!list.equals([])) Assert.fail();
		},
		
		"setItem 0" : function() {
			list.setItem(0, "a");
			if (!list.equals(["a"])) Assert.fail();
		},

		"setItem 0 again" : function() {
			list.setItem(0, "b");
			if (!list.equals(["b"])) Assert.fail();
		},
		
		"setItem 5" : function() {
			list.setItem(5, "a");
			if (!list.equals(["b",null,null,null,null,"a"])) Assert.fail();
		},

		"clear 5" : function() {
			list.clear(5);
			if (!list.equals(["b",null,null,null,null])) Assert.fail();
		},

		"clear 0" : function() {
			list.clear(0);
			if (!list.equals([null,null,null,null,null])) Assert.fail();
		},

		"clear" : function() {
			list.clear();
			if (list.length != 0) Assert.fail();
		},
		
		"setTo" : function() {
			list.setTo(["a","b","c"]);
			if (!list.equals(["a","b","c"])) Assert.fail();
		},

		"add(undefined)" : function(){
			list.clear();
			list.add("a");
			if (!list.equals(["a"])) Assert.fail();
		},

		"add(0)" : function(){
			list.add("b", 0);
			if (!list.equals(["b","a"])) Assert.fail();
		},
		
		"add(1)" : function(){
			list.add("c", 1);
			if (!list.equals(["b","c","a"])) Assert.fail();
		},
		
		"add(5)" : function(){
			list.add("f", 5);
			if (!list.equals(["b","c","a", null, null, "f"])) Assert.fail();
		},
		
		"addList" : function() {
			list.clear();
			list.addList(["a","b","c"]);
			if (!list.equals(["a","b","c"])) Assert.fail();
		},

		"addList(1)" : function() {
			list.clear();
			list.addList(["a","b","c"], 1);
			if (!list.equals([null,"a","b","c"])) Assert.fail();
		},
		
		"removeItem(undefined)" : function() {
			list.clear();
			list.removeItem();
			if (list.length != 0) Assert.fail("Length is wrong");
		},
		
		"removeItem(0)" : function() {
			list.setTo(["a","b","c"]);
			list.removeItem(0);
			if (!list.equals(["b","c"])) Assert.fail();
		},
		

		"remove first item" : function(){
			list.clear();
			list.setItem(0, "a");
			list.remove("a");
			if (list[0] == "a") Assert.fail();
			if (list.length != 0) Assert.fail("Length is wrong");
		},
		
		"remove middle item" : function() {
			list.setTo(["a","b","c"]);
			list.remove("b");
			if (!list.equals(["a","c"])) Assert.fail();
			list.clear();
		},
		
		"remove last item" : function() {
			list.setTo(["a","b","c"]);
			list.remove("c");
			if (!list.equals(["a","b"])) Assert.fail();
		},
		
		"removeList: undefined" : function() {
			list.setTo(["a","b","c"]);
			list.removeList();
			if (!list.equals(["a","b","c"])) Assert.fail();
		},
		
		"removeList" : function() {
			list.setTo(["a","b","c","a","c"]);
			list.removeList(["a","c"]);
			if (!list.equals(["b"])) Assert.fail();
		},
		
		"replace" : function() {
			list.setTo(["a","b","c","a"]);
			list.replace("a","z");
			if (!list.equals(["z","b","c","z"])) Assert.fail();
		},
		
		"replace:missing" : function() {
			list.setTo(["a","b","c","a"]);
			list.replace("d","z");
			if (!list.equals(["a","b","c","a"])) Assert.fail();
		},

		"replace:undefined" : function() {
			list.setTo(["a","b","c","a"]);
			list.replace(null,"z");
			if (!list.equals(["a","b","c","a"])) Assert.fail();
		},
		
		"append" : function() {
			list.setTo(["a","b","c"]);
			list.append("d");
			if (!list.equals(["a","b","c","d"])) Assert.fail();
		},


		"append to empty" : function() {
			list.clear();
			list.append("a");
			if (!list.equals(["a"])) Assert.fail();
		},

		"prepend" : function() {
			list.setTo(["a","b","c"]);
			list.prepend("d");
			if (!list.equals(["d","a","b","c"])) Assert.fail();
		},


		"prepend to empty" : function() {
			list.clear();
			list.prepend("a");
			if (!list.equals(["a"])) Assert.fail();
		},
		
		"contains" : function() {
			list.setTo(["a","b","c","d"]);
			if (!list.contains("a")) Assert.fail("Couldn't find item");
			if (list.contains("e")) Assert.fail("Found missing item");
		},

		"indexOf" : function() {
			list.setTo(["a","b","c","d","a"]);
			if (list.indexOf("a") != 0) Assert.fail("Couldn't find first item");
			if (list.indexOf("a", 1) != 4) Assert.fail("Couldn't find second occurance of item");
			if (list.indexOf("d") != 3) Assert.fail("Couldn't find last item");
			if (list.indexOf("e") != -1) Assert.fail("Found missing item");
		},

		"lastIndexOf" : function() {
			list.setTo(["a","b","c","d","a"]);
			if (list.lastIndexOf("a") != 4) Assert.fail("Couldn't find item");
			if (list.lastIndexOf("a", 3) != 0) Assert.fail("Couldn't find second occurance of item");
			if (list.lastIndexOf("d") != 3) Assert.fail("Couldn't find last item");
			if (list.lastIndexOf("e") != -1) Assert.fail("Found missing item");
		},

		"splice - remove 2" : function() {
			list.setTo(["a","b","c","d"]);
			list.splice(0, 2);
			if (!list.equals(["c","d"])) Assert.fail();
		},

		"splice - add 2" : function() {
			list.setTo(["a","b","c","d"]);
			list.splice(0, null, "x","y","z");
			if (!list.equals(["x","y","z","a","b","c","d"])) Assert.fail();
		},

		"splice - add and remove" : function() {
			list.setTo(["a","b","c","d"]);
			list.splice(1, 2, "x","y","z");
			if (!list.equals(["a","x","y","z","d"])) Assert.fail();
		},

		"sort undefined" : function() {
			list.setTo(["d","c","b","a"]);
			list.sort();
			if (!list.equals(["a","b","c","d"])) Assert.fail();
		},
		
		"sort ascending" : function() {
			list.setTo(["d","c","d","b","a"]);
			list.sort(null, false);
			if (!list.equals(["a","b","c","d","d"])) Assert.fail();
		},

		"sort descending" : function() {
			list.setTo(["d","c","d","b","a"]);
			list.sort(null, true);
			if (!list.equals(["d","d","c","b","a"])) Assert.fail();
		},

		"sort by property" : function() {
			var a1 = {a:1}, a2 = {a:2}, a3 = {a:3}, a4 = {a:4};
			list.setTo([a1, a3, a2, a4]);
			list.sort("a");
			if (!list.equals([a1, a2, a3, a4])) Assert.fail();
		},

		"sort by property ascending" : function() {
			var a1 = {a:1}, a2 = {a:2}, a3 = {a:3}, a4 = {a:4};
			list.setTo([a1, a3, a2, a4]);
			list.sort("a", false);
			if (!list.equals([a1, a2, a3, a4])) Assert.fail();
		},
		
		"sort by property descending" : function() {
			var a1 = {a:1}, a2 = {a:2}, a3 = {a:3}, a4 = {a:4};
			list.setTo([a1, a3, a2, a4]);
			list.sort("a", true);
			if (!list.equals([a4, a3, a2, a1])) Assert.fail();
		},
		
		"slice undefined" : function() {
			list.setTo(["a","b","c","d"]);
			if (!list.slice().equals(["a","b","c","d"])) Assert.fail();
		},

		"slice 1->" : function() {
			list.setTo(["a","b","c","d"]);
			if (!list.slice(1).equals(["b","c","d"])) Assert.fail();
		},
		
		"slice 1->3" : function() {
			list.setTo(["a","b","c","d"]);
			if (!list.slice(1,3).equals(["b","c"])) Assert.fail();
		},

		"slice 1->5" : function() {
			list.setTo(["a","b","c","d"]);
			if (!list.slice(1, 5).equals(["b","c","d"])) Assert.fail();
		},
		
		"slice outside of range" : function() {
			list.setTo(["a","b","c","d"]);
			if (!list.slice(5,10).equals([])) Assert.fail();
		},
		
		"clone empty" : function() {
			list.clear();
			var clone = list.clone();
			if (!clone.constructor == list.constructor) Assert.fail("Created object of wrong type.");
			if (!clone.equals([])) Assert.fail();
		},
		
		"clone full" : function() {
			list.setTo(["a","b","c"]);
			var clone = list.clone();
			if (!clone.constructor == list.constructor) Assert.fail("Created object of wrong type.");
			if (!clone.equals(list)) Assert.fail();
		},

		"forEach simple" : function() {
			list.setTo(["a","b","c","d"]);
			var results = list.forEach(function(it) {
				return it;
			});
			if (!results.equals(list)) Assert.fail();
		},


		"forEach method caller" : function() {
			list.setTo([
				{value : "a", getValue: function(){return this.value}},
				{value : "b", getValue: function(){return this.value}},
				{value : "c", getValue: function(){return this.value}},
				{value : "d"}
			]);

			var results = list.forEach("getValue");
			if (!results.equals(["a","b","c",null])) Assert.fail();
		},

		"select" : function() {
			var results = list.select(function(it){return it && it.value == "a"});
			if (results.value != "a") Assert.fail();
		},
		
		"select method caller" : function() {
			var results = list.select("getValue");
			if (results.value != "a") Assert.fail();
		},

		"selectAll" : function() {
			var results = list.selectAll(function(it){return it && it.value == "a"});
			if (results.length != 1 || results[0].value != "a") Assert.fail();
		},
		
		"selectAll method caller" : function() {
			var results = list.selectAll("getValue");
			if (results.length != 3) Assert.fail();
		},
		
		"getProperty" : function() {
			var results = list.getProperty("value");
			if (!results.equals(["a","b","c","d"])) Assert.fail();
		},
		
		"all - match all" : function() {
			var results = list.all(function(it){return it.value});
			if (!results) Assert.fail();
		},

		"all - match 1" : function() {
			var results = list.all(function(it){return it.value == "a"});
			if (results) Assert.fail();
		},
		
		"all method caller" : function() {
			var results = list.all("getValue");
			if (results) Assert.fail();
		},

		"some - match all" : function() {
			var results = list.some(function(it){return it.value});
			if (!results) Assert.fail();
		},

		"some - match 1" : function() {
			var results = list.some(function(it){return it.value == "a"});
			if (!results) Assert.fail();
		},
		
		"some - match 0" : function() {
			var results = list.some(function(it){return it.value == "z"});
			if (results) Assert.fail();
		},
		
		
		//
		//	unqiueness
		//
		"set list.unique = true for empty list" : function() {
			list.clear();
			list.unique = true;
			if (!list.unique) Assert.fail();
		},

		"add non-unique" : function() {
			list.add("a");
			list.add("a");
			list.add("b");
			list.add("b");
			if (!list.equals(["a","b"])) Assert.fail();
		},
		
		"restore list.unique" : function() {
			list.unique = false;
			if (list.unique) Assert.fail();
		},
		
		"add non-unique again" : function() {
			list.add("a");
			list.add("b");
			if (!list.equals(["a","b","a","b"])) Assert.fail();
		},

		"set list.unique = true for non-unique" : function() {
			list.unique = true;
			if (!list.unique) Assert.fail();
			if (!list.equals(["a","b"])) Assert.fail("Didn't remove duplicate items");
		},

		"addList to unique list" : function() {
			list.addList(["a","b","c"]);
			if (!list.equals(["a","b","c"])) Assert.fail("Added items more than once");
		},


		//
		//	compactness
		//
		"set list.compact = true for empty list" : function() {
			list.unique = false;
			list.clear();
			list.compact = true;
			if (!list.compact) Assert.fail();
		},

		"add non-compact" : function() {
			list.add("a");
			list.add(null);
			list.add("b");
			list.add(null);
			if (!list.equals(["a","b"])) Assert.fail();
		},
		
		"restore list.compact" : function() {
			list.compact = false;
			if (list.compact) Assert.fail();
		},
		
		"add non-compact again" : function() {
			list.add(null);
			list.add("c");
			list.add(null);
			list.add("d");
			if (!list.equals(["a","b",null,"c",null,"d"])) Assert.fail();
		},

		"set list.compact = true for non-compact" : function() {
			list.compact = true;
			if (!list.compact) Assert.fail();
			if (!list.equals(["a","b","c","d"])) Assert.fail("Didn't remove null items");
		},

		"addList to compact list" : function() {
			list.addList([null,"e",null,"f",null]);
			if (!list.equals(["a","b","c","d","e","f"])) Assert.fail("Added items more than once");
		},

		
		//
		//	compact and unique
		//
		"set compact and unique" : function() {
			list.clear();
			list.unique = true;
			list.compact = true;
			if (!list.compact) Assert.fail();
			if (!list.unique) Assert.fail();
		},

		"add non-unique and non-compact" : function() {
			list.add("a");
			list.add(null);
			list.add("b");
			list.add(null);
			list.add("a");
			list.add(null);
			list.add("b");
			list.add(null);
			if (!list.equals(["a","b"])) Assert.fail();
		},
		
		"restore list.compact and unique" : function() {
			list.compact = false;
			list.unique = false;
			if (list.compact) Assert.fail();
			if (list.unique) Assert.fail();
		},
		
		"add non-compact again again" : function() {
			list.add("a");
			list.add("b");
			list.add(null);
			list.add("c");
			list.add(null);
			list.add("d");
			if (!list.equals(["a","b","a","b",null,"c",null,"d"])) Assert.fail();
		},

		"set compact and unique for non-compact" : function() {
			list.compact = true;
			list.unique = true;
			if (!list.equals(["a","b","c","d"])) Assert.fail("Didn't remove duplicate items");
		},

		"addList to compact list again" : function() {
			list.addList(["a",null,"e",null,"f",null]);
			if (!list.equals(["b","c","d","a","e","f"])) Assert.fail("Added items more than once");
		},
	}
});
