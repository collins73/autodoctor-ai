import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const WEBHOOK_SECRET = 'whsec_1a2rZBOwVu8tfotMKP4UAtV1CoTOLUDc';

async function verifyStripeSignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const parts = signature.split(',').reduce((acc: Record<string, string>, part) => {
      const [k, v] = part.split('=');
      acc[k] = v;
      return acc;
    }, {});

    const timestamp = parts['t'];
    const sigHash = parts['v1'];
    const payload = `${timestamp}.${body}`;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
    const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

    return computed === sigHash;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    const valid = await verifyStripeSignature(body, signature, WEBHOOK_SECRET);
    if (!valid) {
      console.error('❌ Webhook signature verification failed');
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    const base44 = createClientFromRequest(req);

    console.log(`📩 Received event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.user_id || session.client_reference_id;

      console.log(`💳 Checkout completed — userId: ${userId}`);

      if (userId) {
        await base44.asServiceRole.entities.User.update(userId, {
          subscription_status: 'active',
          trial_exhausted: false,
        });
        console.log(`✅ User ${userId} upgraded to Pro`);
      }
    }

    if (event.type === 'customer.subscription.deleted' || event.type === 'invoice.payment_failed') {
      const obj = event.data.object;
      const userId = obj.metadata?.user_id;

      if (userId) {
        await base44.asServiceRole.entities.User.update(userId, {
          subscription_status: 'expired',
        });
        console.log(`⚠️ User ${userId} subscription expired`);
      }
    }

    return Response.json({ received: true });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
