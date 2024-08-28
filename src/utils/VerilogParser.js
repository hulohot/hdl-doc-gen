import HDLParser from './HDLParser';

export default class VerilogParser extends HDLParser {
  constructor(verilogCode) {
    super(verilogCode);
    this.verilogCode = verilogCode;
  }

  getModuleName() {
    const moduleRegex = /module\s+(\w+)/;
    const match = this.code.match(moduleRegex);
    return match ? match[1] : 'Unknown';
  }

  getPorts() {
    const portRegex = /(input|output|inout)\s+(reg|wire)?\s*(\[[\d:]+\])?\s*(\w+)/g;
    const ports = [];
    let match;
    while ((match = portRegex.exec(this.code)) !== null) {
      ports.push({
        direction: match[1],
        type: match[2] || 'wire',
        width: match[3] ? match[3].replace(/[\[\]]/g, '') : '1',
        name: match[4]
      });
    }
    return ports;
  }

  getGenericPorts() {
    const genericPortRegex = /parameter\s+(\w+)\s*=\s*([^,;\n]+)/g;
    const genericPorts = [];
    let match;

    while ((match = genericPortRegex.exec(this.code)) !== null) {
      genericPorts.push({
        name: match[1],
        defaultValue: match[2].trim()
      });
    }

    return genericPorts;
  }

  generateSampleUsage() {
    const moduleName = this.getModuleName();
    const ports = this.getPorts();
    const genericPorts = this.getGenericPorts();
    let sampleUsage = `${moduleName} #(\n`;
    genericPorts.forEach((param, index) => {
      sampleUsage += `  .${param.name}(${param.defaultValue})${index < genericPorts.length - 1 ? ',' : ''}\n`;
    });
    sampleUsage += `) instance_name (\n`;
    ports.forEach((port, index) => {
      sampleUsage += `  .${port.name}(${port.name})${index < ports.length - 1 ? ',' : ''}\n`;
    });
    sampleUsage += ');';
    return sampleUsage;
  }

  generateTestbench() {
    const moduleName = this.getModuleName();
    const ports = this.getPorts();
    const genericPorts = this.getGenericPorts();
    
    let testbench = `\`timescale 1ns / 1ps\n\n`;
    testbench += `module ${moduleName}_tb;\n\n`;
    
    // Declare parameters
    genericPorts.forEach(param => {
      testbench += `  parameter ${param.name} = ${param.defaultValue};\n`;
    });
    testbench += '\n';
    
    // Declare reg and wire
    ports.forEach(port => {
      const type = port.direction === 'input' ? 'reg' : 'wire';
      testbench += `  ${type} ${port.width !== '1' ? `[${port.width}]` : ''} ${port.name};\n`;
    });
    
    testbench += `\n  // Instantiate the Unit Under Test (UUT)\n`;
    testbench += `  ${moduleName} #(\n`;
    genericPorts.forEach((param, index) => {
      testbench += `    .${param.name}(${param.name})${index < genericPorts.length - 1 ? ',' : ''}\n`;
    });
    testbench += `  ) uut (\n`;
    ports.forEach((port, index) => {
      testbench += `    .${port.name}(${port.name})${index < ports.length - 1 ? ',' : ''}\n`;
    });
    testbench += `  );\n\n`;
    
    testbench += `  initial begin\n`;
    testbench += `    // Initialize Inputs\n`;
    ports.filter(port => port.direction === 'input').forEach(port => {
      testbench += `    ${port.name} = 0;\n`;
    });
    
    testbench += `\n    // Wait 100 ns for global reset to finish\n`;
    testbench += `    #100;\n\n`;
    testbench += `    // Add stimulus here\n`;
    testbench += `    // Example:\n`;
    const inputPorts = ports.filter(port => port.direction === 'input');
    if (inputPorts.length > 0) {
      testbench += `    ${inputPorts[0].name} = 1;\n`;
      testbench += `    #10;\n`;
      testbench += `    ${inputPorts[0].name} = 0;\n`;
    }
    
    testbench += `  end\n`;
    testbench += `endmodule\n`;
    
    return testbench;
  }
}