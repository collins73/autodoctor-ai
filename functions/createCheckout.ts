import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';
const PRICE_ID = 'price_1TBkQqJGTY0RTrTbwG4XasNn';
const APP_URL = 'https://rebelauto-diagnostics-ai.base44.app';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = new URLSearchParams();
    body.set('mode', 'subscription');
    body.set('line_items[0][price]', PRICE_ID);
    body.set('line_items[0][quantity]', '1');
    if (user.email) body.set('customer_email', user.email);
    body.set('client_reference_id', user.id);
    body.set('success_url', `${APP_URL}?upgraded=true`);
    body.set('cancel_url', `${APP_URL}?upgraded=false`);
    body.set('metadata[user_id]', user.id);
    body.set('subscription_data[metadata][user_id]', user.id);
    body.set('allow_promotion_codes', 'true');

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const session = await res.json() as any;

    if (!res.ok || session.error) {
      return Response.json({ error: session.error?.message || 'Stripe error' }, { status: 400 });
    }

    return Response.json({ success: true, url: session.url });

  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
