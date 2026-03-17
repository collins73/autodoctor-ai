import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const body = await req.text();
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
