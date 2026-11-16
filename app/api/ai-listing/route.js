// Server-side only: the API key never reaches the browser.
// Uses Google Gemini when GEMINI_API_KEY is set, otherwise Anthropic if
// ANTHROPIC_API_KEY is set. Without either key the button shows a friendly message.

const PROMPT = (category) =>
  `This is a photo of an item or service sold by a small local ${category || 'shop'} business in India. Reply with ONLY JSON: {"name": short product name, "description": one friendly sentence under 25 words, "price": a fair integer price in Indian rupees}.`;

function parseListing(text) {
  const clean = (text || '').replace(/```json|```/g, '').trim();
  const j = JSON.parse(clean);
  return { name: j.name, description: j.description, price: Math.round(Number(j.price)) || 0 };
}

async function geminiListing(imageUrl, category) {
  const img = await fetch(imageUrl);
  if (!img.ok) throw new Error('image fetch failed');
  const mime = img.headers.get('content-type') || 'image/jpeg';
  const data = Buffer.from(await img.arrayBuffer()).toString('base64');
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType: mime, data } },
            { text: PROMPT(category) },
          ],
        }],
        generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
      }),
    }
  );
  if (!r.ok) throw new Error('gemini request failed');
  const json = await r.json();
  const text = (json.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
  return parseListing(text);
}

async function anthropicListing(imageUrl, category) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: imageUrl } },
          { type: 'text', text: PROMPT(category) },
        ],
      }],
    }),
  });
  if (!r.ok) throw new Error('anthropic request failed');
  const data = await r.json();
  const text = (data.content || []).map((c) => c.text || '').join('');
  return parseListing(text);
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Could not read the request. Try again.' }, { status: 400 });
  }

  const { imageUrl, category } = body || {};
  const provider = process.env.GEMINI_API_KEY ? 'gemini' : process.env.ANTHROPIC_API_KEY ? 'anthropic' : null;
  if (!provider)
    return Response.json({ error: 'AI is not set up. Add GEMINI_API_KEY, or type the details yourself.' }, { status: 501 });
  if (!imageUrl)
    return Response.json({ error: 'Upload a photo first, or type the details yourself.' }, { status: 400 });

  try {
    const listing = provider === 'gemini'
      ? await geminiListing(imageUrl, category)
      : await anthropicListing(imageUrl, category);
    return Response.json(listing);
  } catch {
    return Response.json({ error: 'Could not read the AI reply. Type the details yourself.' }, { status: 502 });
  }
}
