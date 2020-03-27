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