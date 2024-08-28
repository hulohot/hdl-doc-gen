'use client'

import { useState, useEffect } from 'react';
import Image from "next/image";
import VerilogParser from '../utils/VerilogParser';
import SVGGenerator from '../utils/SVGGenerator';
import AIDescriptionGenerator from '../utils/AIDescriptionGenerator';
import CircuitSpinner from '../components/CircuitSpinner';

export default function Home() {
  const [verilogCode, setVerilogCode] = useState('');
  const [documentation, setDocumentation] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyBlurred, setIsApiKeyBlurred] = useState(false);
  const [genericPorts, setGenericPorts] = useState([]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--transition-time', '400ms');
    root.style.setProperty('--bg-color', darkMode ? '#111827' : '#ffffff');
    root.style.setProperty('--text-color', darkMode ? '#ffffff' : '#000000');
    root.style.setProperty('--border-color', darkMode ? '#4b5563' : '#e5e7eb');
    root.style.setProperty('--code-bg-color', darkMode ? '#1f2937' : '#f3f4f6');
  }, [darkMode]);

  useEffect(() => {
    // Check for stored API key on component mount
    const storedApiKey = localStorage.getItem('secureApiKey');
    if (storedApiKey) {
      console.log('Retrieved stored API key (first 4 chars):', storedApiKey.substring(0, 4));
      setApiKey(storedApiKey);
      setIsApiKeyBlurred(true);
    } else {
      console.log('No stored API key found');
    }
  }, []);

  const generateDocumentation = async () => {
    setIsLoading(true);
    const parser = new VerilogParser(verilogCode);
    const moduleName = parser.getModuleName();
    const ports = parser.getPorts();
    const genericPorts = parser.getGenericPorts();
    setGenericPorts(genericPorts);
    
    let aiDescription = '';
    if (apiKey) {
      try {
        console.log('Attempting to generate AI description...');
        console.log('API Key (first 4 chars):', apiKey.substring(0, 4));
        aiDescription = await AIDescriptionGenerator.generate(verilogCode, apiKey, genericPorts);
      } catch (error) {
        console.error('Error generating AI description:', error);
        console.error('Error stack:', error.stack);
        aiDescription = `Unable to generate AI description. Error: ${error.message}. Please check the console for more details.`;
      }
    } else {
      aiDescription = 'Enter your OpenAI API key to generate an AI description of the module.';
    }

    const sampleUsage = parser.generateSampleUsage();
    const testbench = parser.generateTestbench();

    setDocumentation({ moduleName, ports, genericPorts, aiDescription, sampleUsage, testbench });
    setIsLoading(false);
  };

  const generateMarkdown = () => {
    if (!documentation) return '';

    let markdown = `# ${documentation.moduleName}\n\n`;
    
    if (documentation.genericPorts.length > 0) {
      markdown += `## Generic Parameters\n\n`;
      markdown += `| Name | Default Value |\n`;
      markdown += `|------|---------------|\n`;
      documentation.genericPorts.forEach(param => {
        markdown += `| ${param.name} | ${param.defaultValue} |\n`;
      });
      markdown += `\n`;
    }
    
    markdown += `## Ports\n\n`;
    markdown += `| Name | Direction | Width | Type |\n`;
    markdown += `|------|-----------|-------|------|\n`;
    documentation.ports.forEach(port => {
      markdown += `| ${port.name} | ${port.direction} | ${port.width} | ${port.type} |\n`;
    });

    markdown += `\n## Block Diagram\n\n`;
    markdown += `[SVG Block Diagram]\n\n`;

    markdown += `## AI-Generated Description\n\n`;
    markdown += `${documentation.aiDescription}\n\n`;

    markdown += `## Sample Usage\n\n`;
    markdown += '```verilog\n';
    markdown += documentation.sampleUsage;
    markdown += '\n```\n\n';

    markdown += `## Sample Testbench\n\n`;
    markdown += '```verilog\n';
    markdown += documentation.testbench;
    markdown += '\n```\n';

    return markdown;
  };

  const copyToClipboard = () => {
    const markdown = generateMarkdown();
    navigator.clipboard.writeText(markdown)
      .then(() => alert('Documentation copied to clipboard!'))
      .catch(err => console.error('Failed to copy: ', err));
  };

  const downloadMarkdown = () => {
    const markdown = generateMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentation.moduleName}_documentation.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadSVG = () => {
    if (!documentation) return;
    const svg = SVGGenerator.generate(documentation.ports, darkMode);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentation.moduleName}_block_diagram.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const lerpColor = (a, b, amount) => {
    const ah = parseInt(a.replace(/#/g, ''), 16),
          ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
          bh = parseInt(b.replace(/#/g, ''), 16),
          br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
          rr = ar + amount * (br - ar),
          rg = ag + amount * (bg - ag),
          rb = ab + amount * (bb - ab);

    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
  };

  const toggleColor = lerpColor('#d1d5db', '#4b5563', darkMode ? 1 : 0);

  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
    setIsApiKeyBlurred(false);
  };

  const handleApiKeySubmit = () => {
    if (apiKey) {
      console.log('Storing API key (first 4 chars):', apiKey.substring(0, 4));
      localStorage.setItem('secureApiKey', apiKey);
      setIsApiKeyBlurred(true);
    }
  };

  const handleApiKeyClear = () => {
    setApiKey('');
    setIsApiKeyBlurred(false);
    localStorage.removeItem('secureApiKey');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 transition-colors" style={{
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-color)',
      transitionProperty: 'background-color, color',
      transitionDuration: 'var(--transition-time)',
    }}>
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl" style={{ color: 'var(--text-color)' }}>Verilog Document Generator</h1>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" value="" className="sr-only peer" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 transition-colors`} style={{ backgroundColor: toggleColor, transitionDuration: 'var(--transition-time)' }}></div>
            <span className="ml-3 text-sm font-medium" style={{ color: 'var(--text-color)', transitionDuration: 'var(--transition-time)' }}>
              {darkMode ? 'Dark Mode' : 'Light Mode'}
            </span>
          </label>
        </div>

        {/* Add app description and API key disclaimer here */}
        <div className="mb-6 text-sm">
          <p className="mb-2">
            This Verilog Document Generator helps you create comprehensive documentation for your Verilog modules. 
            It extracts module information, generates sample usage and testbenches, and can provide AI-generated descriptions.
          </p>
          <p className="text-yellow-500 dark:text-yellow-400">
            <strong>API Key Disclaimer:</strong> Your OpenAI API key is required for AI-generated descriptions but is not stored on our servers. 
            It is securely saved in your browser's local storage for convenience.
          </p>
        </div>

        <textarea
          className="w-full h-40 p-2 border rounded"
          style={{
            backgroundColor: 'var(--bg-color)',
            color: 'var(--text-color)',
            borderColor: 'var(--border-color)',
            transitionProperty: 'background-color, color, border-color',
            transitionDuration: 'var(--transition-time)'
          }}
          placeholder="Paste your Verilog code here"
          value={verilogCode}
          onChange={(e) => setVerilogCode(e.target.value)}
        />
        
        <div className="mt-2 flex space-x-2">
          <input
            className="w-full p-2 border rounded"
            style={{
              backgroundColor: 'var(--bg-color)',
              color: 'var(--text-color)',
              borderColor: 'var(--border-color)',
              transitionProperty: 'background-color, color, border-color',
              transitionDuration: 'var(--transition-time)'
            }}
            type={isApiKeyBlurred ? "password" : "text"}
            placeholder="OpenAI API Key (required for AI description)"
            value={isApiKeyBlurred ? '••••••••••••••••' : apiKey}
            onChange={handleApiKeyChange}
          />
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={handleApiKeySubmit}
          >
            Submit
          </button>
          {isApiKeyBlurred && (
            <button
              className="px-4 py-2 bg-red-500 text-white rounded"
              onClick={handleApiKeyClear}
            >
              Clear
            </button>
          )}
        </div>
        
        <div className="mt-4 flex space-x-4 items-center">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={generateDocumentation}
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Documentation'}
          </button>
          
          {documentation && (
            <>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded"
                onClick={copyToClipboard}
              >
                Copy to Clipboard
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded"
                onClick={downloadMarkdown}
              >
                Download Markdown
              </button>
              <button
                className="px-4 py-2 bg-purple-500 text-white rounded"
                onClick={downloadSVG}
              >
                Download SVG
              </button>
            </>
          )}
        </div>
        
        {isLoading && (
          <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
            <CircuitSpinner />
          </div>
        )}
        
        {documentation && (
          <div className="mt-8" style={{ color: 'var(--text-color)' }}>
            <h2 className="text-xl mb-2">Module: {documentation.moduleName}</h2>
            
            {documentation.genericPorts.length > 0 && (
              <>
                <h3 className="text-lg mt-4 mb-2">Generic Parameters:</h3>
                <table className="w-full border-collapse border" style={{ borderColor: 'var(--border-color)', transitionDuration: 'var(--transition-time)' }}>
                  <thead>
                    <tr>
                      <th className="border p-2" style={{ borderColor: 'var(--border-color)' }}>Name</th>
                      <th className="border p-2" style={{ borderColor: 'var(--border-color)' }}>Default Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentation.genericPorts.map((param, index) => (
                      <tr key={index}>
                        <td className="border p-2" style={{ borderColor: 'var(--border-color)' }}>{param.name}</td>
                        <td className="border p-2" style={{ borderColor: 'var(--border-color)' }}>{param.defaultValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            
            <h3 className="text-lg mt-4 mb-2">Ports:</h3>
            <table className="w-full border-collapse border" style={{ borderColor: 'var(--border-color)', transitionDuration: 'var(--transition-time)' }}>
              <thead>
                <tr>
                  <th className="border p-2" style={{ borderColor: 'var(--border-color)' }}>Name</th>
                  <th className="border p-2" style={{ borderColor: 'var(--border-color)' }}>Direction</th>
                  <th className="border p-2" style={{ borderColor: 'var(--border-color)' }}>Width</th>
                  <th className="border p-2" style={{ borderColor: 'var(--border-color)' }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {documentation.ports.map((port, index) => (
                  <tr key={index}>
                    <td className="border p-2" style={{ borderColor: 'var(--border-color)' }}>{port.name}</td>
                    <td className="border p-2" style={{ borderColor: 'var(--border-color)' }}>{port.direction}</td>
                    <td className="border p-2" style={{ borderColor: 'var(--border-color)' }}>{port.width}</td>
                    <td className="border p-2" style={{ borderColor: 'var(--border-color)' }}>{port.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <h3 className="text-lg mt-4 mb-2">Block Diagram:</h3>
            <div dangerouslySetInnerHTML={{ __html: SVGGenerator.generate(documentation.ports, darkMode) }} />
            
            <h3 className="text-lg mt-4 mb-2">AI-Generated Description:</h3>
            {apiKey ? (
              <p>{documentation.aiDescription}</p>
            ) : (
              <p className="text-yellow-500">
                Enter your OpenAI API key above to generate an AI description of the module.
              </p>
            )}
            
            <h3 className="text-lg mt-4 mb-2">Sample Usage:</h3>
            <pre className="p-2 rounded" style={{ 
              backgroundColor: 'var(--code-bg-color)', 
              color: 'var(--text-color)',
              transitionProperty: 'background-color, color',
              transitionDuration: 'var(--transition-time)'
            }}>
              {documentation.sampleUsage}
            </pre>
            
            <h3 className="text-lg mt-4 mb-2">Sample Testbench:</h3>
            <pre className="p-2 rounded overflow-x-auto" style={{ 
              backgroundColor: 'var(--code-bg-color)', 
              color: 'var(--text-color)',
              transitionProperty: 'background-color, color',
              transitionDuration: 'var(--transition-time)'
            }}>
              {documentation.testbench}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
