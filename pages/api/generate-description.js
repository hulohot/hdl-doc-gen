import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { verilogCode, apiKey, genericPorts } = req.body;

  if (!verilogCode || !apiKey) {
    return res.status(400).json({ error: 'Missing verilogCode or apiKey' });
  }

  try {
    const openai = new OpenAI({ apiKey });
    
    let prompt = "You are an expert in Verilog and digital design. Provide a concise description of the following Verilog module, including its functionality, ports, and generic parameters (if any).\n\n";
    
    if (genericPorts && genericPorts.length > 0) {
      prompt += "Generic parameters:\n";
      genericPorts.forEach(param => {
        prompt += `- ${param.name} (default: ${param.defaultValue})\n`;
      });
      prompt += "\n";
    }
    
    prompt += "Verilog code:\n" + verilogCode;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: "Describe this Verilog module concisely." }
      ],
      max_tokens: 200
    });

    res.status(200).json({ description: response.choices[0].message.content.trim() });
  } catch (error) {
    console.error('Error in API route:', error);
    res.status(500).json({ error: 'Error generating description' });
  }
}