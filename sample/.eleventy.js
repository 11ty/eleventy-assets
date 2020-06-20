const fs = require("fs");
const { InlineCodeManager } = require("../");

function getCssFilePath(componentName) {
	return `./css/${componentName}.css`;
}

module.exports = function(eleventyConfig) {
	let cssManager = new InlineCodeManager();

	eleventyConfig.addShortcode("usingComponent", function(componentName) {
		// If a never before seen component, add the CSS code
		if(!cssManager.hasComponentCode(componentName)) {
			// You could read this file asynchronously too if you use an Asynchronous Shortcode
			// Read more: https://www.11ty.dev/docs/shortcodes/
			let componentCss = fs.readFileSync(getCssFilePath(componentName), { encoding: "UTF-8" });
			cssManager.addComponentCode(componentName, componentCss);
		}

		// Log usage for this url
		// this.page.url is supported on Eleventy 0.11.0 and newer
		cssManager.addComponentForUrl(componentName, this.page.url);

		return "";
	});

	// This needs to be called in a Layout template.
	eleventyConfig.addFilter("getCss", (url) => {
		return cssManager.getCodeForUrl(url);
	});

	eleventyConfig.addWatchTarget("./css/*.css");

	// This will tell the `hasComponentCode` check above to reload the
	// component CSS to pick up any new changes.

	// `beforeWatch` is supported on Eleventy 0.11.0-beta.3 and newer
	eleventyConfig.on("beforeWatch", () => {
		cssManager.resetComponentCode();
	});

	return {
		markdownTemplateEngine: "njk"
	}
};