export default class SVGGenerator {
  static generate(ports, darkMode = false) {
    const width = 200;
    const height = 30 + ports.length * 20;
    const boxHeight = height - 20;
    const strokeColor = darkMode ? 'white' : 'black';
    const fillColor = darkMode ? '#374151' : 'none';
    const textColor = darkMode ? 'white' : 'black';

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect x="10" y="10" width="${width - 20}" height="${boxHeight}" fill="${fillColor}" stroke="${strokeColor}" />`;
    svg += `<text x="${width / 2}" y="25" text-anchor="middle" font-family="Arial" font-size="12" fill="${textColor}">Module</text>`;

    ports.forEach((port, index) => {
      const y = 40 + index * 20;
      const direction = port.direction === 'input' ? '→' : '←';
      const x = port.direction === 'input' ? 5 : width - 5;
      const textAnchor = port.direction === 'input' ? 'start' : 'end';
      const textX = port.direction === 'input' ? x + 10 : x - 10;
      
      // Adjust y position for output ports
      const adjustedY = port.direction === 'output' ? y - 10 : y;

      svg += `<text x="${textX}" y="${adjustedY}" text-anchor="${textAnchor}" font-family="Arial" font-size="10" fill="${textColor}">${port.name} ${direction}</text>`;
    });

    svg += '</svg>';
    return svg;
  }

  static getOpenAIKeyLink() {
    return "https://platform.openai.com/account/api-keys";
  }
}