import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';
const PRICE_ID = 'price_1TBkQqJGTY0RTrTbwG4XasNn';
const APP_URL = 'https://rebel-ai-36e8d1bc.base44.app';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Stripe checkout session
    const params = new URLSearchParams({
      'mode': 'subscription',
      'line_items[0][price]': PRICE_ID,
      'line_items[0][quantity]': '1',
      'customer_email': user.email || '',
      'client_reference_id': user.id,
      'success_url': `${APP_URL}?upgraded=true`,
      'cancel_url': `${APP_URL}?upgraded=false`,
      'metadata[user_id]': user.id,
      'subscription_data[metadata][user_id]': user.id,
      'allow_promotion_codes': 'true',
    });

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await res.json();

    if (session.error) {
      return Response.json({ error: session.error.message }, { status: 400 });
    }

    return Response.json({ success: true, url: session.url });

  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
