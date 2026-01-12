import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Replicate from "npm:replicate"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )
    const replicate = new Replicate({
      auth: Deno.env.get('REPLICATE_API_TOKEN'),
    })

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (!user || userError) throw new Error('Usuário não autenticado.')

    const { prompt, mode } = await req.json()
    if (!prompt) throw new Error('Prompt is required')
    
    // --- LÓGICA DE SELEÇÃO DE IA ---
    let COST = 1;
    let predictionParams = {}; 

    if (mode === 'realistic') {
        // === MODO REALISTA (SDXL Fresh Ink) ===
        COST = 3;
        console.log(`Modo Realista selecionado. Custo: ${COST}`);

        const realisticPrompt = `
           photo of a tattoo of ${prompt}, 
           fresh ink style, on skin, natural skin tone, 
           highly detailed, sharp focus, 8k, 
           realistic skin texture, hyperrealistic, 
           professional photography, natural lighting
        `;

        predictionParams = {
            version: "8515c238222fa529763ec99b4ba1fa9d32ab5d6ebc82b4281de99e4dbdcec943",
            input: {
                prompt: realisticPrompt.trim(),
                // Mistura dos seus parâmetros com proteção de cor
                negative_prompt: "oversaturated, orange skin, red skin, excessive redness, sunburn looking, perfect skin, ugly, broken, distorted, drawing, painting, illustration, cartoon, anime, blurry, low quality",
                width: 1024,
                height: 1024,
                scheduler: "K_EULER",
                
                // --- AJUSTES DO USUÁRIO ---
                lora_scale: 0.6, // Reduzido de 0.8 para 0.6 (Isso tira o laranja!)
                num_inference_steps: 25, // Mais rápido e menos "queimado"
                refine: "no_refiner", // Evita suavização artificial
                guidance_scale: 7.5,
                apply_watermark: false,
                disable_safety_checker: true,
            }
        };

    } else {
        // === MODO FLASH (Flux 1.1 Pro) ===
        COST = 1;
        console.log(`Modo Flash selecionado. Custo: ${COST}`);

        const flashPrompt = `
           tattoo flash design, ${prompt}, 
           white background, vector style, 
           clean lines, black ink, minimalist, 
           high contrast, no shading, stencil style
        `;

        predictionParams = {
            model: "black-forest-labs/flux-1.1-pro",
            input: {
                prompt: flashPrompt.trim(),
                aspect_ratio: "1:1",
                output_format: "jpg",
                output_quality: 100,
                safety_tolerance: 5
            }
        };
    }

    // Verificar Saldo
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) throw new Error('Perfil não encontrado.')

    if (profile.credits < COST) {
      throw new Error(`Créditos insuficientes. Você precisa de ${COST} créditos.`)
    }

    // Gerar Imagem
    console.log(`Enviando para Replicate...`);
    let prediction = await replicate.predictions.create(predictionParams);

    prediction = await replicate.wait(prediction)

    if (prediction.status === 'failed') {
        console.error("Falha Replicate:", prediction.error);
        throw new Error('Falha na geração da IA.');
    }

    // Descontar Créditos
    const newBalance = profile.credits - COST;
    await supabaseClient
      .from('profiles')
      .update({ credits: newBalance })
      .eq('id', user.id)

    return new Response(
      JSON.stringify({ image: prediction.output, remaining_credits: newBalance }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error("Erro Backend:", error)
    
    let status = 500;
    let message = error.message;

    if (message.includes('insuficientes')) status = 402;
    if (message.includes('429')) {
        message = "Limite de velocidade atingido. Aguarde alguns segundos.";
        status = 429;
    }

    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
    )
  }
})