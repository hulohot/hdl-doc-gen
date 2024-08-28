import HDLParser from './HDLParser';

export default class VHDLParser extends HDLParser {
  getModuleName() {
    const entityRegex = /entity\s+(\w+)\s+is/i;
    const match = this.code.match(entityRegex);
    return match ? match[1] : 'Unknown';
  }

  getPorts() {
    const portRegex = /(\w+)\s*:\s*(in|out|inout)\s+(std_logic(?:_vector)?)(\s*\((.*?)\))?/gi;
    const ports = [];
    let match;
    while ((match = portRegex.exec(this.code)) !== null) {
      ports.push({
        name: match[1],
        direction: match[2].toLowerCase(),
        type: match[3],
        width: match[3] === 'std_logic' ? '1' : (match[5] ? match[5].trim() : null)
      });
    }
    return ports;
  }

  getGenericPorts() {
    const genericPortRegex = /generic\s*\(([\s\S]*?)\);/i;
    const genericParamRegex = /(\w+)\s*:\s*(\w+)(\s*\(\s*(\d+)\s+(downto|to)\s+(\d+)\s*\))?(\s*:=\s*([^;]+))?/g;
    const genericMatch = this.code.match(genericPortRegex);
    const genericPorts = [];
    
    if (genericMatch) {
      let paramMatch;
      while ((paramMatch = genericParamRegex.exec(genericMatch[1])) !== null) {
        genericPorts.push({
          name: paramMatch[1],
          type: paramMatch[2],
          width: paramMatch[3] ? `${paramMatch[4]} ${paramMatch[5]} ${paramMatch[6]}` : null,
          defaultValue: paramMatch[7] ? paramMatch[8].trim() : null
        });
      }
    }
    return genericPorts;
  }

  getRequiredLibraries() {
    const libraryRegex = /library\s+(\w+);/gi;
    const useRegex = /use\s+([\w.]+);/gi;
    const libraries = new Set();
    const packages = new Set();

    let match;
    while ((match = libraryRegex.exec(this.code)) !== null) {
      libraries.add(match[1]);
    }
    while ((match = useRegex.exec(this.code)) !== null) {
      packages.add(match[1]);
    }

    return {
      libraries: Array.from(libraries),
      packages: Array.from(packages)
    };
  }

  generateSampleUsage() {
    const entityName = this.getModuleName();
    const ports = this.getPorts();
    const genericPorts = this.getGenericPorts();
    
    let sampleUsage = `${entityName}_instance : entity work.${entityName}\n`;
    if (genericPorts.length > 0) {
      sampleUsage += `  generic map (\n`;
      genericPorts.forEach((param, index) => {
        sampleUsage += `    ${param.name} => ${param.defaultValue || '/* Your value here */'}${index < genericPorts.length - 1 ? ',' : ''}\n`;
      });
      sampleUsage += `  )\n`;
    }
    sampleUsage += `  port map (\n`;
    ports.forEach((port, index) => {
      sampleUsage += `    ${port.name} => ${port.name}${index < ports.length - 1 ? ',' : ''}\n`;
    });
    sampleUsage += `  );`;
    return sampleUsage;
  }

  generateTestbench() {
    const entityName = this.getModuleName();
    const ports = this.getPorts();
    const genericPorts = this.getGenericPorts();
    
    const requiredLibraries = this.getRequiredLibraries();
    
    let testbench = '';
    requiredLibraries.libraries.forEach(lib => {
      testbench += `library ${lib};\n`;
    });
    requiredLibraries.packages.forEach(pkg => {
      testbench += `use ${pkg};\n`;
    });
    testbench += '\n';
    
    testbench += `entity ${entityName}_tb is\nend ${entityName}_tb;\n\n`;
    testbench += `architecture Behavioral of ${entityName}_tb is\n\n`;
    
    // Component declaration
    testbench += `  component ${entityName} is\n`;
    if (genericPorts.length > 0) {
      testbench += `    generic (\n`;
      genericPorts.forEach((param, index) => {
        testbench += `      ${param.name} : ${param.type}${param.defaultValue ? ` := ${param.defaultValue}` : ''}${index < genericPorts.length - 1 ? ';\n' : '\n'}`; 
      });
      testbench += `    );\n`;
    }
    testbench += `    port (\n`;
    ports.forEach((port, index) => {
      testbench += `      ${port.name} : ${port.direction} ${port.type}${port.width ? `(${port.width})` : ''}${index < ports.length - 1 ? ';\n' : '\n'}`;
    });
    testbench += `    );\n`;
    testbench += `  end component;\n\n`;
    
    // Signal declarations
    ports.forEach(port => {
      testbench += `  signal ${port.name} : ${port.type}${port.width ? `(${port.width})` : ''};\n`;
    });
    
    testbench += `\nbegin\n\n`;
    
    // UUT instantiation
    testbench += `  uut: ${entityName}\n`;
    if (genericPorts.length > 0) {
      testbench += `    generic map (\n`;
      genericPorts.forEach((param, index) => {
        testbench += `      ${param.name} => ${param.defaultValue}${index < genericPorts.length - 1 ? ',\n' : '\n'}`;
      });
      testbench += `    )\n`;
    }
    testbench += `    port map (\n`;
    ports.forEach((port, index) => {
      testbench += `      ${port.name} => ${port.name}${index < ports.length - 1 ? ',\n' : '\n'}`;
    });
    testbench += `    );\n\n`;
    
    // Stimulus process
    testbench += `  stim_proc: process\n  begin\n`;
    testbench += `    -- Initialization\n`;
    ports.filter(port => port.direction === 'in').forEach(port => {
      testbench += `    ${port.name} <= ${port.type}'(others => '0');\n`;
    });
    testbench += `    wait for 100 ns;\n\n`;
    testbench += `    -- Stimulus here\n`;
    testbench += `    -- Example:\n`;
    const inputPorts = ports.filter(port => port.direction === 'in');
    if (inputPorts.length > 0) {
      testbench += `    ${inputPorts[0].name} <= ${inputPorts[0].type}'(others => '1');\n`;
      testbench += `    wait for 10 ns;\n`;
      testbench += `    ${inputPorts[0].name} <= ${inputPorts[0].type}'(others => '0');\n`;
    }
    testbench += `    wait;\n`;
    testbench += `  end process;\n\n`;
    testbench += `end Behavioral;\n`;
    
    return testbench;
  }
}