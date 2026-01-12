import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

app.post('/api/generate-tattoo', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt inválido' });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    const fullPrompt = `
Create a tattoo design image.
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
      (p) => p.inlineData?.mimeType?.startsWith('image/')
    );

    if (!imagePart?.inlineData?.data) {
      return res.json({
        error: 'Gemini não retornou imagem',
        raw: result.response,
      });
    }

    res.json({
      imageBase64: `data:image/png;base64,${imagePart.inlineData.data}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar tatuagem' });
  }
});

app.listen(3333, () => {
  console.log('🔥 API rodando em http://localhost:3333');
});
