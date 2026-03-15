Deno.serve(async (req) => {
  try {
    const { fault_code, year, make, model, mileage } = await req.json();

    if (!fault_code) {
      return Response.json({ error: "fault_code is required" }, { status: 400 });
    }

    const vehicleContext = (year && make && model)
      ? `Vehicle: ${year} ${make} ${model}${mileage ? ` with ${mileage} miles` : ""}.`
      : "";

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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    return Response.json({ success: true, diagnosis: result });

  } catch (err: any) {
    return Response.json({ error: "AI diagnosis failed", details: err.message }, { status: 500 });
  }
});
