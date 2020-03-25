const DependencyGraph = require("dependency-graph").DepGraph;

class InlineCodeManager {
  constructor() {
    this.urlKeyPrefix = "11ty_URL_KEY::";
    this.init();
  }

  init() {
    this.graph = new DependencyGraph();
    this.code = {};
  }

  _isUrlKey(key) {
    return key.startsWith(this.urlKeyPrefix);
  }

  _normalizeUrlKey(url) {
    if(url) {
      return this.urlKeyPrefix + url;
    }
  }

  static getComponentNameFromPath(filePath, fileExtension) {
    filePath = filePath.split("/").pop();
    return fileExtension ? filePath.substr(0, filePath.lastIndexOf(fileExtension)) : filePath;
  }

  hasComponent(componentName) {
    return this.graph.hasNode(componentName);
  }

  addComponentForUrl(componentName, url) {
    this._addDependency(componentName, this._normalizeUrlKey(url));
  }

  addComponentRelationship(parent, child) {
    this._addDependency(child, parent);
  }

  _addDependency(from, to) {
    if(from && to) {
      if(!this.graph.hasNode(from)) {
        this.graph.addNode(from);
      }
      if(!this.graph.hasNode(to)) {
        this.graph.addNode(to);
      }
      this.graph.addDependency(from, to);
    }
  }

  // strips file extensions
  addRawComponentRelationship(parentComponentFile, childComponentFile, fileExtension) {
    let parentName = InlineCodeManager.getComponentNameFromPath(parentComponentFile, fileExtension);
    let childName = InlineCodeManager.getComponentNameFromPath(childComponentFile, fileExtension);

    this.addComponentRelationship(parentName, childName);
  }

  getComponentListForComponent(componentName) {
    return this._getComponentList(componentName);
  }

  getComponentListForUrl(url) {
    let urlKey = this._normalizeUrlKey(url);
    return this._getComponentList(urlKey);
  }

  _getComponentList(key) {
    if(!this.graph.hasNode(key)) {
      return [];
    }
    return this.graph.dependantsOf(key).filter(key => !this._isUrlKey(key));
  }

  /* styleNodes come from `rollup-plugin-css-only`->output */
  addRollupComponentNodes(styleNodes, fileExtension) {
    for(let path in styleNodes) {
      let componentName = InlineCodeManager.getComponentNameFromPath(path, fileExtension);
      this.addComponentCode(componentName, styleNodes[path]);
    }
  }

  resetComponentCode() {
    this.code = {};
  }

  hasComponentCode(componentName) {
    return !!this.code[componentName];
  }

  addComponentCode(componentName, code) {
    if(!this.code[componentName]) {
      this.code[componentName] = new Set();
    }
    this.code[componentName].add(code);
  }

  getComponentCode(componentName) {
    if(this.code[componentName]) {
      return Array.from(this.code[componentName]).map(entry => entry.trim());
    }
    return [];
  }

  // TODO add priority level for components and only inline the ones that are above a priority level
  // Maybe high priority corresponds with how high on the page the component is used
  // TODO shared bundles if there are a lot of shared code across URLs
  getCodeForUrl(url) {
    return this.getComponentListForUrl(url).map(componentName => {
      let componentCodeArr = this.getComponentCode(componentName);
      if(componentCodeArr.length) {
        return `/* ${componentName} Component */
${componentCodeArr.join("\n")}`;
      }
      return "";
    }).filter(entry => !!entry).join("\n");
  }

}

module.exports = InlineCodeManager;