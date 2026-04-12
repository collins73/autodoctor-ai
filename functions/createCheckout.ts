import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const STRIPE_SECRET_KEY = Deno.env.get('SECRET_KEY') || '';
const APP_URL = 'https://rebelauto-diagnostics-ai.base44.app';

Deno.serve(async (req) => {
  try {
    if (!STRIPE_SECRET_KEY) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    let userId = '';
    let userEmail = '';
    try {
      const base44 = createClientFromRequest(req);
      const user = await base44.auth.me();
      if (user) {
        userId = user.id || '';
        userEmail = user.email || '';
      }
    } catch (_) {}

    const reqBody = await req.json().catch(() => ({})) as any;
    if (!userId && reqBody.userId) userId = reqBody.userId;
    if (!userEmail && reqBody.email) userEmail = reqBody.email;

    const body = new URLSearchParams();
    body.set('mode', 'subscription');
    body.set('line_items[0][price_data][currency]', 'usd');
    body.set('line_items[0][price_data][recurring][interval]', 'month');
    body.set('line_items[0][price_data][unit_amount]', '1999');
    body.set('line_items[0][price_data][product_data][name]', 'Rebel Auto Agent Pro');
    body.set('line_items[0][price_data][product_data][description]', 'Unlimited diagnostics, shop finder & priority support');
    body.set('line_items[0][quantity]', '1');
    if (userEmail) body.set('customer_email', userEmail);
    if (userId) {
      body.set('client_reference_id', userId);
      body.set('metadata[user_id]', userId);
      body.set('subscription_data[metadata][user_id]', userId);
    }
    body.set('success_url', `${APP_URL}?upgraded=true`);
    body.set('cancel_url', `${APP_URL}?upgraded=false`);
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
