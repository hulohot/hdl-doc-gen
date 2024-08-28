import axios from 'axios';

export default class AIDescriptionGenerator {
  static async generate(verilogCode, apiKey) {
    try {
      const response = await axios.post(
        process.env.NEXT_PUBLIC_OPENAI_API_ENDPOINT,
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that describes Verilog modules.' },
            { role: 'user', content: `Describe this Verilog module:\n\n${verilogCode}` }
          ],
          max_tokens: 150
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating AI description:', error);
      throw error; // Re-throw the error to be caught in the component
    }
  }
}