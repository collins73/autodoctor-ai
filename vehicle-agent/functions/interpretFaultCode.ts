import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const TRIAL_LIMIT = 5;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check trial status
    const users = await base44.asServiceRole.entities.User.filter({ id: user.id });
    const userRecord = users[0] || {};
    const diagnosisCount = userRecord.diagnosis_count || 0;
    const subscriptionStatus = userRecord.subscription_status || 'trial';

    if (subscriptionStatus !== 'active' && diagnosisCount >= TRIAL_LIMIT) {
      return Response.json({
        error: 'trial_exhausted',
        message: 'You have used all 5 free diagnoses. Upgrade to continue.',
        diagnosis_count: diagnosisCount,
        trial_limit: TRIAL_LIMIT,
      }, { status: 403 });
    }

    const { fault_code, year, make, model, mileage } = await req.json();

    if (!fault_code) {
      return Response.json({ error: 'fault_code is required' }, { status: 400 });
    }

    const vehicleContext = (year && make && model)
      ? `Vehicle: ${year} ${make} ${model}${mileage ? ` with ${mileage} miles` : ''}.`
      : '';

    const prompt = `You are AutoDoctor AI, an expert automotive diagnostic assistant. Analyze the following OBD-II fault code and provide a detailed, accurate diagnosis.

${vehicleContext}
Fault Code: ${fault_code.toUpperCase()}

Respond ONLY with a valid JSON object in this exact format:
{
  "fault_code": "${fault_code.toUpperCase()}",
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

    const apiKey = Deno.env.get('OPENAI_KEY');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      }),
    });

    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return Response.json({ error: 'Failed to parse OpenAI response', raw }, { status: 500 });
    }

    if (!data.choices || !data.choices[0]) {
      return Response.json({ error: 'Unexpected OpenAI response', data }, { status: 500 });
    }

    const result = JSON.parse(data.choices[0].message.content);

    // Increment diagnosis count
    const newCount = diagnosisCount + 1;
    await base44.asServiceRole.entities.User.update(user.id, {
      diagnosis_count: newCount,
      trial_exhausted: newCount >= TRIAL_LIMIT,
      subscription_status: subscriptionStatus || 'trial',
    });

    return Response.json({
      success: true,
      diagnosis: result,
      trial_info: {
        diagnosis_count: newCount,
        trial_limit: TRIAL_LIMIT,
        remaining: Math.max(0, TRIAL_LIMIT - newCount),
        trial_exhausted: newCount >= TRIAL_LIMIT,
      },
    });

  } catch (err: any) {
    return Response.json({ error: 'AI diagnosis failed', details: err.message }, { status: 500 });
  }
});
