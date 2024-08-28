class AIDescriptionGenerator {
  static async generate(verilogCode, apiKey, genericPorts) {
    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verilogCode, apiKey, genericPorts }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate description');
      }

      const data = await response.json();
      return data.description;
    } catch (error) {
      console.error('Error in AIDescriptionGenerator:', error);
      throw error;
    }
  }
}

export default AIDescriptionGenerator;