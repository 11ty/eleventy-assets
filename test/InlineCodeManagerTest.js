const test = require("ava");
const InlineCodeManager = require("../InlineCodeManager");

test("getComponentNameFromPath", t => {
	t.is(InlineCodeManager.getComponentNameFromPath("hi.js", ".js"), "hi");
	t.is(InlineCodeManager.getComponentNameFromPath("test/hi.js", ".js"), "hi");
	t.is(InlineCodeManager.getComponentNameFromPath("sdlfjslkd/test/hi-2.js", ".js"), "hi-2");
});

test("Log components used on a URL", t => {
	let mgr = new InlineCodeManager();
	mgr.addComponentForUrl("header", "/");
	t.deepEqual(mgr.getComponentListForUrl("/"), ["header"]);
	t.deepEqual(mgr.getComponentListForUrl("/child/"), []);

	mgr.addComponentForUrl("other-header", "/other-url/");
	t.deepEqual(mgr.getFullComponentList(), ["header", "other-header"]);

	// de-dupes
	mgr.addComponentForUrl("header", "/");
	t.deepEqual(mgr.getComponentListForUrl("/"), ["header"]);
	t.deepEqual(mgr.getComponentListForUrl("/child/"), []);

	mgr.addComponentForUrl("other-header", "/other-url/");
	t.deepEqual(mgr.getFullComponentList(), ["header", "other-header"]);
});

test("Get component list for a URL but only components that have code", t => {
	let mgr = new InlineCodeManager();
	mgr.addComponentForUrl("header", "/");
	mgr.addComponentForUrl("footer", "/");
	t.deepEqual(mgr.getRelevantComponentListForUrl("/"), []);
	t.deepEqual(mgr.getRelevantComponentListForUrl("/child/"), []);

	mgr.addComponentCode("header", "/* this is code */");
	t.deepEqual(mgr.getRelevantComponentListForUrl("/"), ["header"]);
	t.deepEqual(mgr.getRelevantComponentListForUrl("/child/"), []);

	mgr.addComponentCode("footer", ""); // code must not be empty
	t.deepEqual(mgr.getRelevantComponentListForUrl("/"), ["header"]);
	t.deepEqual(mgr.getRelevantComponentListForUrl("/child/"), []);

	mgr.addComponentCode("footer", "/* this is code */");
	t.deepEqual(mgr.getRelevantComponentListForUrl("/"), ["header", "footer"]);
	t.deepEqual(mgr.getRelevantComponentListForUrl("/child/"), []);
});

test("Relationships", t => {
	let mgr = new InlineCodeManager();
	// without a declared fileExtension
	mgr.addRawComponentRelationship("parent.js", "child.js");
	t.deepEqual(mgr.getComponentListForComponent("parent.js"), ["child.js"]);

	mgr.init();
	mgr.addRawComponentRelationship("parent.js", "child.js", ".js");
	t.deepEqual(mgr.getComponentListForComponent("parent"), ["child"]);

	mgr.init();
	mgr.addRawComponentRelationship("parent", "child");
	t.deepEqual(mgr.getComponentListForComponent("parent"), ["child"]);
});

test("Duplicate Relationships", t => {
	let mgr = new InlineCodeManager();
	mgr.addRawComponentRelationship("parent.js", "child.js", ".js");
	mgr.addRawComponentRelationship("parent.js", "child.js", ".js");
	mgr.addRawComponentRelationship("parent.js", "test.js", ".js");

	t.deepEqual(mgr.getComponentListForComponent("parent"), ["child", "test"]);
});

test("Relationships roll into final component list", t => {
	let mgr = new InlineCodeManager();
	mgr.addComponentForUrl("parent", "/");
	mgr.addRawComponentRelationship("parent.js", "child.js", ".js");
	mgr.addRawComponentRelationship("aunt.js", "cousin.js", ".js");

	t.deepEqual(mgr.getComponentListForUrl("/"), ["child", "parent"]);
	t.deepEqual(mgr.getFullComponentList(), ["child", "parent"]);

	mgr.addComponentForUrl("other-parent", "/other-path/");
	t.deepEqual(mgr.getFullComponentList(), ["child", "parent", "other-parent"]);

	mgr.addComponentForUrl("cousin", "/");
	// t.deepEqual(mgr.getComponentListForUrl("/"), ["parent", "child", "cousin"]);
	t.deepEqual(mgr.getComponentListForUrl("/"), ["child", "parent", "cousin"]);
	t.deepEqual(mgr.getFullComponentList(), ["child", "parent", "cousin", "other-parent"]);

	mgr.addComponentForUrl("aunt", "/");
	t.deepEqual(mgr.getComponentListForUrl("/"), ["child", "parent", "cousin", "aunt"]);
	t.deepEqual(mgr.getFullComponentList(), ["child", "parent", "cousin", "aunt", "other-parent"]);
});

test("Relationships roll into final component list (sibling/child)", t => {
	let mgr = new InlineCodeManager();
	mgr.addComponentForUrl("parent", "/");
	mgr.addRawComponentRelationship("parent.js", "child.js", ".js");
	mgr.addRawComponentRelationship("parent.js", "sibling.js", ".js");

	t.deepEqual(mgr.getComponentListForUrl("/"), ["child", "sibling", "parent"]);
	t.deepEqual(mgr.getFullComponentList(), ["child", "sibling", "parent"]);
});

test("Add Component Code", t => {
	let cssMgr = new InlineCodeManager();
	let fontWeight = "p { font-weight: 700; }";
	let fontColor = "div { color: blue; }";

	cssMgr.addComponentCode("header", fontWeight);
	cssMgr.addComponentCode("header", fontColor);

	// de-dupes duplicate code
	cssMgr.addComponentCode("header", fontWeight);
	t.deepEqual(cssMgr.getComponentCode("header"), [fontWeight, fontColor]);
});

test("getCodeForUrl", t => {
	let mgr = new InlineCodeManager();
	let fontWeight = "p { font-weight: 700; }";
	let fontColor = "div { color: blue; }";

	mgr.addComponentCode("header", fontWeight);
	mgr.addComponentCode("footer", fontColor);

	mgr.addComponentForUrl("header", "/");
	mgr.addComponentForUrl("footer", "/");
	t.deepEqual(mgr.getCodeForUrl("/"), `/* header Component */
p { font-weight: 700; }
/* footer Component */
div { color: blue; }`);
});

test("getCodeForUrl sorted", t => {
	let mgr = new InlineCodeManager();
	let fontWeight = "p { font-weight: 700; }";
	let fontColor = "div { color: blue; }";

	mgr.addComponentCode("header", fontWeight);
	mgr.addComponentCode("footer", fontColor);

	mgr.addComponentForUrl("header", "/");
	mgr.addComponentForUrl("footer", "/");
	t.deepEqual(mgr.getCodeForUrl("/", {
		sort: function(a, b) {
			// alphabetical
			if(a < b) {
				return -1;
			} else if(a > b) {
				return 1;
			}
			return 0;
		}
	}), `/* footer Component */
div { color: blue; }
/* header Component */
p { font-weight: 700; }`);
});

test("getCodeForUrl filtered", t => {
	let mgr = new InlineCodeManager();
	let fontWeight = "p { font-weight: 700; }";
	let fontColor = "div { color: blue; }";

	mgr.addComponentCode("header", fontWeight);
	mgr.addComponentCode("footer", fontColor);

	mgr.addComponentForUrl("header", "/");
	mgr.addComponentForUrl("footer", "/");
	t.deepEqual(mgr.getCodeForUrl("/", {
		filter: entry => entry !== "header"
	}), `/* footer Component */
div { color: blue; }`);
});

test("getCodeForUrl filtered and sorted", t => {
	let mgr = new InlineCodeManager();
	let fontWeight = "p { font-weight: 700; }";
	let fontColor = "div { color: blue; }";

	mgr.addComponentCode("header", fontWeight);
	mgr.addComponentCode("footer", fontColor);
	mgr.addComponentCode("footer2", fontColor);

	mgr.addComponentForUrl("header", "/");
	mgr.addComponentForUrl("footer", "/");
	mgr.addComponentForUrl("footer2", "/");
	t.deepEqual(mgr.getCodeForUrl("/", {
		filter: entry => entry !== "header",
		sort: function(a, b) {
			// reverse alphabetical
			if(a < b) {
				return 1;
			} else if(a > b) {
				return -1;
			}
			return 0;
		}
	}), `/* footer2 Component */
div { color: blue; }
/* footer Component */
div { color: blue; }`);
});

test("Reset and reset for component", t => {
	let mgr = new InlineCodeManager();
	mgr.addComponentForUrl("header", "/");
	mgr.addComponentCode("header", "/* this is header code */");

	t.deepEqual(mgr.getCodeForUrl("/"), `/* header Component */
/* this is header code */`);

	mgr.addComponentForUrl("footer", "/");
	mgr.addComponentCode("footer", "/* this is footer code */");

	t.deepEqual(mgr.getCodeForUrl("/"), `/* header Component */
/* this is header code */
/* footer Component */
/* this is footer code */`);

	mgr.addComponentForUrl("nav", "/");
	mgr.addComponentCode("nav", "/* this is nav code */");

	t.deepEqual(mgr.getCodeForUrl("/"), `/* header Component */
/* this is header code */
/* footer Component */
/* this is footer code */
/* nav Component */
/* this is nav code */`);

	mgr.resetComponentCodeFor("footer");

	t.deepEqual(mgr.getCodeForUrl("/"), `/* header Component */
/* this is header code */
/* nav Component */
/* this is nav code */`);

	mgr.resetComponentCodeFor("nav");

	t.deepEqual(mgr.getCodeForUrl("/"), `/* header Component */
/* this is header code */`);

	mgr.resetComponentCode();

	t.deepEqual(mgr.getCodeForUrl("/"), ``);
});