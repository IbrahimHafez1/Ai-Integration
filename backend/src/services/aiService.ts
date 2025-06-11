import { GoogleGenerativeAI } from '@google/generative-ai';

export async function parseLead(message: string): Promise<any> {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  if (!GOOGLE_API_KEY) throw new Error('Missing GOOGLE_API_KEY in .env');

  const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = [
    `Extract lead details from the following message into a JSON object.`,
    `Message: "${message}"`,
    ``,
    `Return a JSON object with these fields:`,
    `- name (string)`,
    `- email (string)`,
    `- phone (string)`,
    `- interest (string)`,
    `- company (string, optional)`,
    ``,
    `Return ONLY the JSON object. No other text.`,
  ].join('\n');

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No response from Gemini');
    }

    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to parse lead: ${error.message}`);
  }
}
