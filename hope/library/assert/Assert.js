/** Assert -- test runner for hope.

	Give it a bunch of test file urls and it will execute tests in each.

	TODO: 
		- have some way of remembering suites on load & executing later
		- nicer UI than console (simple outputter for log)
	
*/


/** Check a bunch of assertions. */
function Assert(suite, whenDone) {
	if (!suite.name) return Assert.log.error("Assert(",suite,"): suite must contain a 'name' with name of test suite.");

	Assert.Suites[suite.name] = suite;

	suite.succeeded = 0;
	suite.failed = 0;
	suite.fails = [];


	Assert.log.group("Suite "+suite.name);
	if (suite.start) {
		try {
			suite.start();
		} catch (e) {
			Assert.log.error("Error executing start: ", e);
			suite.failed++;
			suite.fails.push("start");
		}
	}
	
	if (!suite.failed) {
		for (var key in suite.tests) {
			var test = suite.tests[key];
			try {
				test();
				Assert.log.success(key +" - success!");
				suite.succeeded++;
			} catch (e) {
				Assert.log.error(key +" - failed!", e);
				suite.failed++;
				suite.fails.push(key);
			}
		}
	}
	
	if (suite.end) {
		try {
			suite.end();
		} catch (e) {
			Assert.log.error("Error executing end: ", e);
			suite.failed++;
			suite.fails.push("end");
		}
	}

	Assert.log.groupEnd();
	if (suite.failed) {
		suite.success = false;
		Assert.Failed.push(suite);
		Assert.success = false;
		Assert.log.error("Suite failed! ("+suite.succeeded+" tests succeeded"+", "
							+suite.failed," tests failed).  Failures:", suite.fails);
	} else {
		suite.success = true;
		Assert.Succeeded.push(suite);
		Assert.log.success("Suite succeeded! ("+suite.succeeded+" tests succeeded"+")");
	}

	if (Assert.next) Assert.next();
}

Assert.log = new Log();

extend(Assert, {
	/** Overall success or failure of ALL suites. */
	success : true,
	
	/* List of suites that have suceeded. */
	Succeeded : [],

	/* List of suites that have failed. */
	Failed : [],

	/** Map of suites we have processed. */
	Suites : {},
	
	// generic failure thing
	fail : function(message){	
		throw message || "";
	},	
	
	/* Initialize the Assert object to get going. */
	initialize : function() {
		Assert.log.clear();

		// register the 'tests' directory
		Loader.setPath("tests", "{hope}tests/");
	},
	
	/** Run tests in (a list of) urls. */
	load : function(url1, url2, etc) {
		var urls = Array.args(arguments);
		Assert.next = function loadNext() {
			var url = urls.shift();
			if (!url) {
				if (Assert.next) {
					delete Assert.next;
					Assert.log.warn("Done processing list");
					Assert.log.groupEnd();
				}
				return;
			}
			
//			Assert.log.group("Loading url ",url);

			var contents = Loader.loadText(url, true, 
				function success(text) {
					try {
						eval(text);
					} catch (e) {
						console.error("Error asserting "+url+":",e);
						if (Assert.next) Assert.next();
					}
				}, 
				
				function failure() {
					Assert.log.error("Could not load test file ",url);
					if (Assert.next) Assert.next();
				}
			);
			
		}
		Assert.log.group("Loading urls ",urls);
		Assert.next();
	}
});


Assert.initialize();
