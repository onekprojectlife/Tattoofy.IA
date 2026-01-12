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

    // Autenticação
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (!user || userError) throw new Error('Usuário não autenticado.')

    const { message } = await req.json()

    // Prompt de Sistema: Define a personalidade da IA
    const systemPrompt = `
      Você é um Tatuador Profissional com 15 anos de experiência.
      Seu nome é "Mestre Tattofy".
      
      SUAS REGRAS:
      1. Responda sempre em Português do Brasil.
      2. Seja descolado, mas muito profissional e responsável.
      3. Dê dicas sobre: design, dor, cicatrização, cuidados pós-tattoo e biossegurança.
      4. Se o usuário pedir um desenho, dê ideias e descreva, mas lembre-o de usar o gerador de imagens acima.
      5. Nunca recomende procedimentos médicos, apenas cuidados básicos de tatuagem (limpeza, pomada, etc).
      6. Respostas curtas e diretas (máximo 3 parágrafos).
    `;

    // Estrutura do Llama 3
    const fullPrompt = `
      <|begin_of_text|><|start_header_id|>system<|end_header_id|>
      ${systemPrompt}
      <|eot_id|><|start_header_id|>user<|end_header_id|>
      ${message}
      <|eot_id|><|start_header_id|>assistant<|end_header_id|>
    `;

    console.log("Enviando chat para Llama 3...");

    const output = await replicate.run(
      "meta/meta-llama-3-8b-instruct",
      {
        input: {
          prompt: fullPrompt,
          max_tokens: 500,
          temperature: 0.7, // Criatividade balanceada
          top_p: 0.9
        }
      }
    );

    // Llama 3 retorna um array de strings, juntamos tudo
    const reply = Array.isArray(output) ? output.join("").trim() : String(output).trim();

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error("Erro Chat:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})