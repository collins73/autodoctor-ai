import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const TRIAL_LIMIT = 5;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user record
    const users = await base44.asServiceRole.entities.User.filter({ id: user.id });
    const userRecord = users[0] || {};

    const diagnosisCount = userRecord.diagnosis_count || 0;
    const subscriptionStatus = userRecord.subscription_status || 'trial';
    const trialExhausted = diagnosisCount >= TRIAL_LIMIT;
    const remaining = Math.max(0, TRIAL_LIMIT - diagnosisCount);
    const feedbackSubmitted = userRecord.feedback_submitted || false;

    return Response.json({
      success: true,
      diagnosis_count: diagnosisCount,
      trial_limit: TRIAL_LIMIT,
      remaining,
      trial_exhausted: trialExhausted,
      subscription_status: subscriptionStatus,
      feedback_submitted: feedbackSubmitted,
      can_diagnose: subscriptionStatus === 'active' || !trialExhausted,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
