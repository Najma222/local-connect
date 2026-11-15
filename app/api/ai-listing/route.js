// Server-side only: the API key never reaches the browser.
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Could not read the request. Try again.' }, { status: 400 });
  }

  const { imageUrl, category } = body || {};
  if (!process.env.ANTHROPIC_API_KEY)
    return Response.json({ error: 'AI is not set up. Add ANTHROPIC_API_KEY, or type the details yourself.' }, { status: 501 });
  if (!imageUrl)
    return Response.json({ error: 'Upload a photo first, or type the details yourself.' }, { status: 400 });

  let r;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: imageUrl } },
            { type: 'text', text: `This is a photo of an item or service sold by a small local ${category || 'shop'} business in India. Reply with ONLY JSON: {"name": short product name, "description": one friendly sentence under 25 words, "price": a fair integer price in Indian rupees}.` },
          ],
        }],
      }),
    });
  } catch {
    return Response.json({ error: 'AI request failed. Try again or type the details.' }, { status: 502 });
  }

  if (!r.ok) return Response.json({ error: 'AI request failed. Try again or type the details.' }, { status: 502 });
  const data = await r.json();
  try {
    const text = (data.content || []).map((c) => c.text || '').join('').replace(/```json|```/g, '').trim();
    const j = JSON.parse(text);
    return Response.json({ name: j.name, description: j.description, price: Math.round(Number(j.price)) || 0 });
  } catch {
    return Response.json({ error: 'Could not read the AI reply. Type the details yourself.' }, { status: 502 });
  }
}
