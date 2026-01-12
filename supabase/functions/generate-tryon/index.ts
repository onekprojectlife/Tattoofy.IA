import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Replicate from "npm:replicate"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const replicate = new Replicate({
      auth: Deno.env.get('REPLICATE_API_TOKEN'),
    })

    // Voltamos a receber as duas imagens separadas
    const { bodyImage, tattooImage } = await req.json()

    if (!bodyImage || !tattooImage) {
      throw new Error('É necessário enviar a foto do corpo e a tatuagem.')
    }

    console.log("Iniciando ByteDance Seedream 4 (Configuração High Quality)...")

    // PROMPT EXATO SOLICITADO
    const finalPrompt = `
      Professional Tattoo Application. WITHOUT THE WHITE PARTS OF THE TATTOO DESIGN.
      Action: Morph and wrap the provided tattoo design onto the person's skin in the first image.
      Physics: The tattoo must follow the 3D curvature of the body (cylindrical wrapping around arm/body). It must distort naturally with the muscles.
      Texture: Apply 'multiply' blend mode. The ink must look settled INTO the pores of the skin, not floating on top. slightly faded black ink.
      Constraints: Respect anatomical boundaries. Do NOT allow the tattoo to bleed into the background or air. Do NOT cover the face.
      Quality: 8k photorealistic, raw photo style
    `.trim();

    const output = await replicate.run(
      "bytedance/seedream-4", // Modelo Seedream 4
      {
        input: {
          prompt: finalPrompt,
          image_input: [bodyImage, tattooImage], // Array com as duas imagens
          
          // --- CONFIGURAÇÕES ESPECÍFICAS SOLICITADAS ---
          size: "2K",
          aspect_ratio: "match_input_image",
          sequential_image_generation: "disabled",
          max_images: 1,
          enhance_prompt: true, // O 'pulo do gato' para qualidade
          
          // Negative prompt de segurança para garantir qualidade
          negative_prompt: "white background, paper background, sticker border, floating image, cartoon, low quality, blur, watermark, text, deformed body, extra limbs, changed background"
        }
      }
    );

    console.log("Sucesso Replicate:", output);

    // Tratamento robusto do output do Seedream
    let resultUrl = '';

    if (Array.isArray(output) && output.length > 0) {
        const item = output[0];
        // Verifica se é objeto com .url() ou string
        if (typeof item === 'object' && item !== null && 'url' in item) {
             resultUrl = item.url().toString();
        } else {
             resultUrl = String(item);
        }
    } else {
        // Fallback genérico
        resultUrl = String(output);
    }

    return new Response(
      JSON.stringify({ image: resultUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error("Erro Backend:", error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno na IA.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})