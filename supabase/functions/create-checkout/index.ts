import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Cria o cliente Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Recebe os dados do Frontend
    const { priceId, mode, userId, userEmail, creditsAmount } = await req.json()

    if (!priceId || !userId) {
      throw new Error('Dados incompletos (PriceID ou UserID faltando)')
    }

    // Cria a sessão de Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // Adicione 'boleto' se ativar no painel
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode, // 'subscription' ou 'payment'
      success_url: `${req.headers.get('origin')}/perfil?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/`,
      customer_email: userEmail,
      client_reference_id: userId,
      // Metadata é crucial para sabermos o que entregar depois
      metadata: {
        user_id: userId,
        credits_amount: creditsAmount ? creditsAmount.toString() : '0',
        type: mode === 'subscription' ? 'plan_upgrade' : 'credit_refill'
      },
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})