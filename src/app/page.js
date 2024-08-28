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

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--transition-time', '400ms');
    root.style.setProperty('--bg-color', darkMode ? '#111827' : '#ffffff');
    root.style.setProperty('--text-color', darkMode ? '#ffffff' : '#000000');
    root.style.setProperty('--border-color', darkMode ? '#4b5563' : '#e5e7eb');
    root.style.setProperty('--code-bg-color', darkMode ? '#1f2937' : '#f3f4f6');
  }, [darkMode]);

  const generateDocumentation = async () => {
    setIsLoading(true);
    const parser = new VerilogParser(verilogCode);
    const moduleName = parser.getModuleName();
    const ports = parser.getPorts();
    
    let aiDescription = '';
    if (apiKey) {
      try {
        aiDescription = await AIDescriptionGenerator.generate(verilogCode, apiKey);
      } catch (error) {
        console.error('Error generating AI description:', error);
        aiDescription = 'Unable to generate AI description. Error: ' + error.message;
      }
    } else {
      aiDescription = 'Enter your OpenAI API key to generate an AI description of the module.';
    }

    const sampleUsage = parser.generateSampleUsage();
    const testbench = parser.generateTestbench();

    setDocumentation({ moduleName, ports, aiDescription, sampleUsage, testbench });
    setIsLoading(false);
  };

  const generateMarkdown = () => {
    if (!documentation) return '';

    let markdown = `# ${documentation.moduleName}\n\n`;
    markdown += `## Ports\n\n`;
    markdown += `| Name | Direction | Width |\n`;
    markdown += `|------|-----------|-------|\n`;
    documentation.ports.forEach(port => {
      markdown += `| ${port.name} | ${port.direction} | ${port.width} |\n`;
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
        
        <input
          className="w-full mt-2 p-2 border rounded"
          style={{
            backgroundColor: 'var(--bg-color)',
            color: 'var(--text-color)',
            borderColor: 'var(--border-color)',
            transitionProperty: 'background-color, color, border-color',
            transitionDuration: 'var(--transition-time)'
          }}
          type="text"
          placeholder="OpenAI API Key (required for AI description)"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        
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
            
            <h3 className="text-lg mt-4 mb-2">Ports:</h3>
            <table className="w-full border-collapse border" style={{ borderColor: 'var(--border-color)', transitionDuration: 'var(--transition-time)' }}>
              <thead>
                <tr>
                  <th className="border p-2" style={{ borderColor: 'var(--border-color)' }}>Name</th>
                  <th className="border p-2" style={{ borderColor: 'var(--border-color)' }}>Direction</th>
                  <th className="border p-2" style={{ borderColor: 'var(--border-color)' }}>Width</th>
                </tr>
              </thead>
              <tbody>
                {documentation.ports.map((port, index) => (
                  <tr key={index}>
                    <td className="border p-2" style={{ borderColor: 'var(--border-color)' }}>{port.name}</td>
                    <td className="border p-2" style={{ borderColor: 'var(--border-color)' }}>{port.direction}</td>
                    <td className="border p-2" style={{ borderColor: 'var(--border-color)' }}>{port.width}</td>
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
