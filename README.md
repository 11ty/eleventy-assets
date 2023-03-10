# Eleventy Assets

_⚠️ This utility is retired and [superseded by the Eleventy Bundle Plugin](https://github.com/11ty/eleventy-plugin-bundle)._

---

Code to help manage assets in your Eleventy project. This is not an `addPlugin` compatible Eleventy plugin. It is an npm package for use in your config or other plugins.

Currently supported features:

* Generate and inline code-split CSS specific to individual pages.
* Can work as a standalone implementation (check out the `./sample/` directory) or in tandem with [`eleventy-plugin-vue`](https://github.com/11ty/eleventy-plugin-vue/).

## Installation

```sh
npm install @11ty/eleventy-assets
```

## Usage

See the `./sample/` directory for an example implementation.

* A `usingComponent` shortcode to log component use in each template.
* A `getCSS` filter for use in layout templates to output the code-split CSS for the current URL (only).
* Component CSS is stored in `./sample/css/`