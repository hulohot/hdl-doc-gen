import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, apiKey, genericPorts, hdlType } = req.body;

  if (!code || !apiKey || !hdlType) {
    return res.status(400).json({ error: 'Missing code, apiKey, or hdlType' });
  }

  try {
    const openai = new OpenAI({ apiKey });
    
    let prompt = `You are an expert in ${hdlType.toUpperCase()} and digital design. Provide a concise description of the following ${hdlType.toUpperCase()} ${hdlType === 'vhdl' ? 'entity' : 'module'}, including its functionality, ports, and generic parameters (if any).\n\n`;
    
    if (genericPorts && genericPorts.length > 0) {
      prompt += "Generic parameters:\n";
      genericPorts.forEach(param => {
        prompt += `- ${param.name} (${hdlType === 'vhdl' ? `type: ${param.type}, ` : ''}default: ${param.defaultValue})\n`;
      });
      prompt += "\n";
    }
    
    prompt += `${hdlType.toUpperCase()} code:\n` + code;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: `Describe this ${hdlType.toUpperCase()} ${hdlType === 'vhdl' ? 'entity' : 'module'} concisely.` }
      ],
      max_tokens: 200
    });

    res.status(200).json({ description: response.choices[0].message.content.trim() });
  } catch (error) {
    console.error('Error in API route:', error);
    res.status(500).json({ error: 'Error generating description' });
  }
}