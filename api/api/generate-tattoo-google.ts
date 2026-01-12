import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

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
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    const fullPrompt = `
Generate a tattoo design IMAGE.
Black ink only.
Tattoo flash style.
White background.
No text.
No watermark.

Tattoo idea: ${prompt}
`;

    const result = await model.generateContent(fullPrompt);

    const parts = result.response.candidates?.[0]?.content?.parts;

    const imagePart = parts?.find(
      (p: any) => p.inlineData?.mimeType?.startsWith('image/')
    );

    if (!imagePart?.inlineData?.data) {
      return new Response(
        JSON.stringify({
          error: 'Gemini did not return an image',
          rawResponse: result.response,
        }),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        imageBase64: `data:image/png;base64,${imagePart.inlineData.data}`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate image with Gemini' }),
      { status: 500 }
    );
  }
}
