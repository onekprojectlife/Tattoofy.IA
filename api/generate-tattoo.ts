export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405 }
    );
  }

  const body = await req.json();
  const prompt = body?.prompt;

  if (!prompt || typeof prompt !== 'string') {
    return new Response(
      JSON.stringify({ error: 'Invalid prompt' }),
      { status: 400 }
    );
  }

  try {
    const fullPrompt = `
Professional tattoo design.
Black ink only.
Clean line art.
High contrast.
Tattoo flash style.
White background.
No text.
No watermark.
No background elements.

Tattoo idea: ${prompt}
`;

    const response = await fetch(
  'https://openrouter.ai/api/v1/images/generations',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'Tattufy Tattoo Generator',
    },
    body: JSON.stringify({
      model: 'stabilityai/sdxl',
      prompt: fullPrompt,
      size: '1024x1024',
    }),
  }
);

console.log('Status:', response.status);


    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', errorText);
      throw new Error('Failed to generate image');
    }

    const data = await response.json();

    const imageBase64 = data?.data?.[0]?.b64_json;

    if (!imageBase64) {
      throw new Error('No image returned');
    }

    return new Response(
      JSON.stringify({
        success: true,
        imageBase64: `data:image/png;base64,${imageBase64}`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate tattoo image' }),
      { status: 500 }
    );
  }
}
