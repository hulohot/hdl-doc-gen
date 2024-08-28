export default class HDLParser {
  constructor(code) {
    this.code = code;
  }

  getModuleName() {
    throw new Error("Method 'getModuleName()' must be implemented.");
  }

  getPorts() {
    throw new Error("Method 'getPorts()' must be implemented.");
  }

  getGenericPorts() {
    throw new Error("Method 'getGenericPorts()' must be implemented.");
  }

  generateSampleUsage() {
    throw new Error("Method 'generateSampleUsage()' must be implemented.");
  }

  generateTestbench() {
    throw new Error("Method 'generateTestbench()' must be implemented.");
  }
}