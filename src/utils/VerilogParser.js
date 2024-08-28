export default class VerilogParser {
  constructor(verilogCode) {
    this.verilogCode = verilogCode;
  }

  getModuleName() {
    const moduleRegex = /module\s+(\w+)/;
    const match = this.verilogCode.match(moduleRegex);
    return match ? match[1] : 'Unknown';
  }

  getPorts() {
    const portRegex = /(input|output|inout)\s+(reg|wire)?\s*(\[[\d:]+\])?\s*(\w+)/g;
    const ports = [];
    let match;
    while ((match = portRegex.exec(this.verilogCode)) !== null) {
      ports.push({
        direction: match[1],
        type: match[2] || 'wire',
        width: match[3] ? match[3].replace(/[\[\]]/g, '') : '1',
        name: match[4]
      });
    }
    return ports;
  }

  generateSampleUsage() {
    const moduleName = this.getModuleName();
    const ports = this.getPorts();
    let sampleUsage = `${moduleName} instance_name (\n`;
    ports.forEach((port, index) => {
      sampleUsage += `  .${port.name}(${port.name})${index < ports.length - 1 ? ',' : ''}\n`;
    });
    sampleUsage += ');';
    return sampleUsage;
  }

  generateTestbench() {
    const moduleName = this.getModuleName();
    const ports = this.getPorts();
    
    let testbench = `\`timescale 1ns / 1ps\n\n`;
    testbench += `module ${moduleName}_tb;\n\n`;
    
    // Declare reg and wire
    ports.forEach(port => {
      const type = port.direction === 'input' ? 'reg' : 'wire';
      testbench += `  ${type} ${port.width !== '1' ? `[${port.width}]` : ''} ${port.name};\n`;
    });
    
    testbench += `\n  // Instantiate the Unit Under Test (UUT)\n`;
    testbench += `  ${moduleName} uut (\n`;
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