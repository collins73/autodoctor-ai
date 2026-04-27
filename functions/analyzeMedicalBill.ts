import base44 from "../base44-client.ts";

export default async function analyzeMedicalBill(req: Request) {
  const { bill_id, bill_text, bill_type } = await req.json();

  if (!bill_id || !bill_text) {
    return Response.json({ error: "bill_id and bill_text are required" }, { status: 400 });
  }

  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    return Response.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  const prompt = `You are an expert medical billing advocate and patient rights specialist. 
A patient has submitted a ${bill_type || "medical bill"} and needs help understanding it.

BILL TEXT:
${bill_text}

Analyze this bill thoroughly and return a JSON response with the following structure:
{
  "plain_english_summary": "A clear, simple 2-3 sentence summary of what this bill is for and what the patient owes",
  "line_items": "A JSON array string of objects: [{code, description, billed_amount, plain_english, is_suspicious}]",
  "potential_errors": "A list of specific billing errors found, or 'No obvious errors detected' if clean",
  "overcharge_flags": "Specific overcharges or double-billing found, or 'No overcharges detected'",
  "negotiation_tips": "3-5 specific actionable tips for negotiating this bill down",
  "dispute_letter": "A complete, ready-to-send dispute letter if errors were found, otherwise provide a negotiation letter template",
  "next_steps": "A numbered list of the top 3-5 immediate actions the patient should take",
  "error_count": number of errors found (0 if none),
  "potential_savings": estimated dollar amount patient could save through negotiation/correction (number only),
  "confidence_score": your confidence in this analysis 0-100
}

Be specific, actionable, and empathetic. Flag any CPT codes that look suspicious. 
Look for: duplicate charges, upcoding, unbundling, facility fees, incorrect patient info.
Return ONLY valid JSON, no markdown.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    // Save analysis to entity
    const saved = await base44.asServiceRole.entities.BillAnalysis.create({
      bill_id,
      plain_english_summary: analysis.plain_english_summary || "",
      line_items: typeof analysis.line_items === "string" ? analysis.line_items : JSON.stringify(analysis.line_items),
      potential_errors: analysis.potential_errors || "",
      overcharge_flags: analysis.overcharge_flags || "",
      negotiation_tips: analysis.negotiation_tips || "",
      dispute_letter: analysis.dispute_letter || "",
      next_steps: analysis.next_steps || "",
      error_count: analysis.error_count || 0,
      potential_savings: analysis.potential_savings || 0,
      confidence_score: analysis.confidence_score || 85,
      status: "complete",
    });

    // Update bill status
    await base44.asServiceRole.entities.MedicalBill.update(bill_id, { status: "analyzed" });

    return Response.json({ success: true, analysis: saved });
  } catch (err) {
    console.error("Analysis error:", err);
    return Response.json({ error: "Analysis failed", details: err.message }, { status: 500 });
  }
}
