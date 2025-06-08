import fetch from 'node-fetch';

export async function parseLead(message: string): Promise<any> {
  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) throw new Error('Missing HF_TOKEN in .env');

  const MODEL = 'mistralai/Mixtral-8x7B-Instruct-v0.1';

  const prompt = [
    `Extract lead details from the following Slack message:`,
    `"${message}"`,
    ``,
    `Return only one STRICT JSON object with these keys:`,
    `  • name     (string)`,
    `  • email    (string)`,
    `  • phone    (string)`,
    `  • interest (string)`,
    `  • company  (string, optional)`,
    `Return ONLY valid JSON. No explanation. No markdown.`,
  ].join('\n');

  const res = await fetch(`https://api-inference.huggingface.co/models/${MODEL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      options: { wait_for_model: true },
    }),
  });

  const result = await res.json();
  if (!res.ok || !Array.isArray(result) || !result[0]?.generated_text) {
    throw new Error(`HF pipeline error ${res.status}:\n${JSON.stringify(result, null, 2)}`);
  }

  const generated = result[0].generated_text;

  const matches = [...generated.matchAll(/\{[\s\S]*?\}/g)];

  for (let i = matches.length - 1; i >= 0; i--) {
    const jsonCandidate = matches[i][0];
    const parsed = JSON.parse(jsonCandidate);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
  }

  throw new Error(`No valid JSON object parsed from model response:\n${generated}`);
}
