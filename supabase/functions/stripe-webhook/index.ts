import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

// Chave Secreta do Webhook (Vamos pegar no Passo 3)
const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text() // Webhook precisa do body como texto puro

  let event
  try {
    // 1. Verifica se o aviso veio mesmo do Stripe (Segurança)
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!,
      undefined,
      cryptoProvider
    )
  } catch (err: any) {
    return new Response(err.message, { status: 400 })
  }

  // 2. Conecta no Banco com permissão de ADMIN (Service Role)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 3. Processa o pagamento aprovado
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const userId = session.metadata.user_id
    const type = session.metadata.type // 'credit_refill' ou 'plan_upgrade'
    
    console.log(`Pagamento recebido de: ${userId} - Tipo: ${type}`)

    if (type === 'credit_refill') {
      const creditsToAdd = parseInt(session.metadata.credits_amount)
      
      // Busca créditos atuais
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single()
      
      const currentCredits = profile?.credits || 0
      
      // Atualiza somando
      await supabase
        .from('profiles')
        .update({ credits: currentCredits + creditsToAdd })
        .eq('id', userId)
    } 
    
    else if (type === 'plan_upgrade') {
        // Lógica de Plano: Descobrir qual plano pelo valor ou ID
        // Exemplo simplificado: Se pagou > 40 reais é Premium
        const amount = session.amount_total / 100
        let newPlan = 'starter'
        if (amount > 20) newPlan = 'basic'
        if (amount > 40) newPlan = 'premium'

        await supabase.from('profiles').update({ plan_type: newPlan }).eq('id', userId)
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})