import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { feedback, rating } = body;

    if (!feedback || feedback.trim().length < 3) {
      return Response.json({ error: 'Feedback is required' }, { status: 400 });
    }

    // Save feedback to user record
    await base44.asServiceRole.entities.User.update(user.id, {
      feedback: `[${rating}/5 stars] ${feedback.trim()}`,
      feedback_submitted: true,
    });

    return Response.json({ success: true, message: 'Feedback saved. Thank you!' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
