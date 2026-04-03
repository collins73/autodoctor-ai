import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const TRIAL_LIMIT = 5;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Gracefully try to get user — don't hard fail if app is private/unauthenticated
    let user: any = null;
    try {
      user = await base44.auth.me();
    } catch (_) {
      // unauthenticated — treat as fresh trial user
    }

    // No user at all — return default fresh trial state
    if (!user) {
      return Response.json({
        success: true,
        diagnosis_count: 0,
        trial_limit: TRIAL_LIMIT,
        remaining: TRIAL_LIMIT,
        trial_exhausted: false,
        subscription_status: 'trial',
        feedback_submitted: false,
        can_diagnose: true,
      });
    }

    // Admin users are always Pro
    if (user.role === 'admin') {
      return Response.json({
        success: true,
        diagnosis_count: 0,
        trial_limit: TRIAL_LIMIT,
        remaining: 999,
        trial_exhausted: false,
        subscription_status: 'active',
        feedback_submitted: false,
        can_diagnose: true,
      });
    }

    // Try to find user record by email
    let userRecord: any = null;
    try {
      const users = await base44.asServiceRole.entities.User.filter({ email: user.email });
      userRecord = users[0] || null;
    } catch {
      userRecord = null;
    }

    const diagnosisCount = userRecord?.diagnosis_count || 0;
    const subscriptionStatus = userRecord?.subscription_status || 'trial';
    const trialExhausted = subscriptionStatus !== 'active' && diagnosisCount >= TRIAL_LIMIT;
    const remaining = Math.max(0, TRIAL_LIMIT - diagnosisCount);
    const feedbackSubmitted = userRecord?.feedback_submitted || false;

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
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
