import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const TRIAL_LIMIT = 5;

Deno.serve(async (req) => {
  try {
    // Parse body first (can only read stream once)
    const body = await req.json().catch(() => ({}));

    const base44 = createClientFromRequest(req);

    // Gracefully handle unauthenticated users
    let user = null;
    let diagnosisCount = 0;
    let subscriptionStatus = 'trial';
    try {
      user = await base44.auth.me();
      if (user) {
        const users = await base44.asServiceRole.entities.User.filter({ id: user.id });
        const userRecord = users[0] || {};
        diagnosisCount = userRecord.diagnosis_count || 0;
        subscriptionStatus = userRecord.subscription_status || 'trial';
      }
    } catch { /* unauthenticated — allow free trial */ }

    // Check trial exhaustion only for authenticated users
    if (user && subscriptionStatus !== 'active' && diagnosisCount >= TRIAL_LIMIT) {
      return Response.json({
        error: 'trial_exhausted',
        message: 'You have used all 5 free diagnoses. Upgrade to continue.',
        diagnosis_count: diagnosisCount,
        trial_limit: TRIAL_LIMIT,
      }, { status: 403 });
    }

    // Normalize field names — support both camelCase and snake_case
    const faultCode = (body.faultCode || body.fault_code || '').toUpperCase().trim();
    const vehicle = body.vehicle || {};
    const { year, make, model, mileage } = vehicle;
    const mode = body.mode || 'standard';
    const symptoms = body.symptoms || '';
    const followUp = body.followUp || '';
    const context = body.context || {};

    const vehicleContext = (year && make && model)
      ? `Vehicle: ${year} ${make} ${model}${mileage ? ` with ${mileage} miles` : ''}.`
      : '';

    const apiKey = Deno.env.get('OPENAI_KEY');
    if (!apiKey) return Response.json({ error: 'OpenAI API key not configured' }, { status: 500 });

    let prompt = '';

    // ── Follow-up chat mode ──────────────────────────────────────────────────
    if (followUp) {
      prompt = `You are Rebel Auto Agent, an expert automotive AI assistant. The user has a follow-up question about their vehicle diagnosis.

${vehicleContext}
Previous diagnosis:
- Fault Code: ${context.fault_code || faultCode}
- Issue: ${context.fault_description || ''}
- Explanation: ${context.plain_english_explanation || ''}
- Recommended action: ${context.recommended_action || ''}

User's follow-up question: "${followUp}"

Respond in plain conversational English. Be helpful, concise, and specific to their vehicle if possible. 2-4 sentences max.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 300,
        }),
      });
      const raw = await response.json();
      const reply = raw.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
      return Response.json({ reply });
    }

    // ── Symptom mode ─────────────────────────────────────────────────────────
    if (mode === 'symptom' || faultCode === 'SYMPTOM') {
      if (!symptoms) return Response.json({ error: 'symptoms are required for symptom mode' }, { status: 400 });

      prompt = `You are Rebel Auto Agent, an expert automotive diagnostic AI. A user has described symptoms without an OBD-II code.

${vehicleContext}
Symptoms described: "${symptoms}"

Based on these symptoms, provide your best diagnosis. Respond ONLY with a valid JSON object:
{
  "fault_code": "SYMPTOM",
  "fault_description": "Most likely issue based on symptoms",
  "plain_english_explanation": "Clear explanation of what is likely wrong and why (2-3 sentences)",
  "severity": "Low|Medium|High|Critical",
  "consequences_if_ignored": "What happens if this is not repaired",
  "recommended_action": "Specific steps to diagnose or fix this",
  "estimated_cost_low": 50,
  "estimated_cost_high": 400,
  "parts_likely_involved": ["part1", "part2"],
  "diy_possible": true,
  "shop_time_hours": 1.5
}`;
    }

    // ── Standard OBD-II mode ─────────────────────────────────────────────────
    else {
      if (!faultCode) return Response.json({ error: 'faultCode is required' }, { status: 400 });

      prompt = `You are Rebel Auto Agent, an expert automotive diagnostic assistant. Analyze the following OBD-II fault code.

${vehicleContext}
Fault Code: ${faultCode}

Respond ONLY with a valid JSON object in this exact format:
{
  "fault_code": "${faultCode}",
  "fault_description": "Short technical name of the fault",
  "plain_english_explanation": "Clear, simple explanation of what this means in plain English (2-3 sentences)",
  "severity": "Low|Medium|High|Critical",
  "consequences_if_ignored": "What happens if this is not repaired (1-2 sentences)",
  "recommended_action": "Specific repair steps recommended",
  "estimated_cost_low": 50,
  "estimated_cost_high": 300,
  "parts_likely_involved": ["part1", "part2"],
  "diy_possible": true,
  "shop_time_hours": 1.5
}`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      }),
    });

    const raw = await response.json();
    if (!raw.choices?.[0]) {
      return Response.json({ error: 'Unexpected OpenAI response', raw }, { status: 500 });
    }

    let result;
    try {
      result = JSON.parse(raw.choices[0].message.content);
    } catch {
      return Response.json({ error: 'Failed to parse AI response', content: raw.choices[0].message.content }, { status: 500 });
    }

    // Increment diagnosis count for authenticated users
    if (user) {
      const newCount = diagnosisCount + 1;
      await base44.asServiceRole.entities.User.update(user.id, {
        diagnosis_count: newCount,
        trial_exhausted: newCount >= TRIAL_LIMIT,
        subscription_status: subscriptionStatus || 'trial',
      });
    }

    // Return the diagnosis directly (flat response — matches what Diagnose.jsx expects)
    return Response.json({
      ...result,
      trial_info: user ? {
        diagnosis_count: diagnosisCount + 1,
        trial_limit: TRIAL_LIMIT,
        remaining: Math.max(0, TRIAL_LIMIT - diagnosisCount - 1),
        trial_exhausted: (diagnosisCount + 1) >= TRIAL_LIMIT,
      } : null,
    });

  } catch (err: any) {
    return Response.json({ error: 'AI diagnosis failed', details: err.message }, { status: 500 });
  }
});
