import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MedicalBill, BillAnalysis } from "@/api/entities";
import { createClient } from "@base44/sdk";

const client = createClient({ appId: "69b2d37fea1b464236e8d1bc" });

export default function MedBillAnalyzer() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    user_name: "",
    user_email: "",
    bill_type: "Medical Bill",
    raw_text: "",
    provider_name: "",
    service_date: "",
    total_billed: "",
    total_owed: "",
  });

  const billTypes = ["Medical Bill", "EOB - Explanation of Benefits", "Insurance Statement", "Hospital Bill", "Prescription Bill", "Other"];

  const handleChange = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleAnalyze = async () => {
    if (!form.raw_text.trim()) {
      setError("Please paste your bill text to continue.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // Save bill to entity
      const bill = await MedicalBill.create({
        ...form,
        total_billed: parseFloat(form.total_billed) || 0,
        total_owed: parseFloat(form.total_owed) || 0,
        status: "pending",
      });

      // Call AI analysis function
      const res = await client.functions.analyzeMedicalBill({
        bill_id: bill.id,
        bill_text: form.raw_text,
        bill_type: form.bill_type,
      });

      if (res.success) {
        setAnalysis(res.analysis);
        setStep(3);
      } else {
        setError("Analysis failed. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%",
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: "10px",
    color: "#fff",
    padding: "12px 16px",
    fontSize: "15px",
    boxSizing: "border-box",
    outline: "none",
  };

  const labelStyle = { fontSize: "13px", color: "#888", marginBottom: "6px", display: "block" };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid #1a1a1a" }}>
        <div onClick={() => navigate("/MedBillLanding")} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
          <span style={{ fontSize: "24px" }}>🏥</span>
          <span style={{ fontSize: "20px", fontWeight: "800", background: "linear-gradient(135deg, #00d4ff, #7B2FBE)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ClearBill AI</span>
        </div>
        <button onClick={() => navigate("/MedBillDashboard")} style={{ background: "transparent", border: "1px solid #333", color: "#aaa", padding: "8px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
          My History
        </button>
      </nav>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "40px 20px" }}>

        {/* Progress */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "40px" }}>
          {["Your Info", "Your Bill", "Results"].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{
                height: "4px",
                borderRadius: "2px",
                background: step > i ? "linear-gradient(90deg, #00d4ff, #7B2FBE)" : "#222",
                marginBottom: "8px"
              }} />
              <span style={{ fontSize: "12px", color: step === i + 1 ? "#00d4ff" : "#555" }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Step 1 — User Info */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "8px" }}>Tell us about yourself</h2>
            <p style={{ color: "#888", marginBottom: "32px" }}>Optional — helps us personalize your dispute letter.</p>
            <div style={{ display: "grid", gap: "20px" }}>
              <div>
                <label style={labelStyle}>Your Name</label>
                <input style={inputStyle} placeholder="John Smith" value={form.user_name} onChange={e => handleChange("user_name", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Email (to save your analysis)</label>
                <input style={inputStyle} type="email" placeholder="john@email.com" value={form.user_email} onChange={e => handleChange("user_email", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Bill Type</label>
                <select style={inputStyle} value={form.bill_type} onChange={e => handleChange("bill_type", e.target.value)}>
                  {billTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Provider / Hospital Name</label>
                <input style={inputStyle} placeholder="City General Hospital" value={form.provider_name} onChange={e => handleChange("provider_name", e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>Service Date</label>
                  <input style={inputStyle} type="date" value={form.service_date} onChange={e => handleChange("service_date", e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Amount You Owe ($)</label>
                  <input style={inputStyle} type="number" placeholder="250.00" value={form.total_owed} onChange={e => handleChange("total_owed", e.target.value)} />
                </div>
              </div>
            </div>
            <button
              onClick={() => setStep(2)}
              style={{ marginTop: "32px", width: "100%", background: "linear-gradient(135deg, #00d4ff, #7B2FBE)", border: "none", color: "#fff", padding: "16px", borderRadius: "12px", fontWeight: "800", cursor: "pointer", fontSize: "16px" }}
            >
              Next: Add My Bill →
            </button>
            <p style={{ textAlign: "center", color: "#555", fontSize: "13px", marginTop: "12px" }}>All fields optional. Skip to paste your bill.</p>
          </div>
        )}

        {/* Step 2 — Paste Bill */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "8px" }}>Paste your bill</h2>
            <p style={{ color: "#888", marginBottom: "24px" }}>Copy and paste the text from your medical bill, EOB, or hospital statement. Include all line items, codes, and amounts.</p>
            {error && <div style={{ background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,60,60,0.3)", borderRadius: "10px", padding: "12px 16px", color: "#ff6b6b", marginBottom: "20px", fontSize: "14px" }}>{error}</div>}
            <textarea
              style={{ ...inputStyle, height: "300px", resize: "vertical", lineHeight: "1.6" }}
              placeholder="Paste your full medical bill text here...&#10;&#10;Example:&#10;Service: Emergency Room Visit&#10;CPT Code: 99285&#10;Billed Amount: $3,500.00&#10;Insurance Paid: $2,100.00&#10;Patient Responsibility: $1,400.00&#10;..."
              value={form.raw_text}
              onChange={e => handleChange("raw_text", e.target.value)}
            />
            <p style={{ color: "#555", fontSize: "12px", marginTop: "8px" }}>💡 Tip: Include CPT codes, dates, and all dollar amounts for the most accurate analysis.</p>
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, background: "transparent", border: "1px solid #333", color: "#aaa", padding: "14px", borderRadius: "12px", cursor: "pointer", fontWeight: "600" }}>← Back</button>
              <button
                onClick={handleAnalyze}
                disabled={loading}
                style={{ flex: 2, background: loading ? "#333" : "linear-gradient(135deg, #00d4ff, #7B2FBE)", border: "none", color: "#fff", padding: "14px", borderRadius: "12px", fontWeight: "800", cursor: loading ? "not-allowed" : "pointer", fontSize: "16px" }}
              >
                {loading ? "🤖 Analyzing your bill..." : "🔍 Analyze My Bill"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Results */}
        {step === 3 && analysis && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
              <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "8px" }}>Analysis Complete</h2>
              <p style={{ color: "#888" }}>Here's what we found in your bill.</p>
            </div>

            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "28px" }}>
              <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "14px", padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: "32px", fontWeight: "900", color: analysis.error_count > 0 ? "#ff6b6b" : "#00d4aa" }}>{analysis.error_count || 0}</div>
                <div style={{ color: "#888", fontSize: "13px", marginTop: "4px" }}>Errors Found</div>
              </div>
              <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "14px", padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: "32px", fontWeight: "900", color: "#00d4ff" }}>${analysis.potential_savings || 0}</div>
                <div style={{ color: "#888", fontSize: "13px", marginTop: "4px" }}>Potential Savings</div>
              </div>
              <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "14px", padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: "32px", fontWeight: "900", color: "#7B2FBE" }}>{analysis.confidence_score || 85}%</div>
                <div style={{ color: "#888", fontSize: "13px", marginTop: "4px" }}>Confidence</div>
              </div>
            </div>

            {/* Plain English Summary */}
            <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
              <h3 style={{ fontWeight: "700", marginBottom: "12px", color: "#00d4ff" }}>📋 Plain English Summary</h3>
              <p style={{ color: "#ccc", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{analysis.plain_english_summary}</p>
            </div>

            {/* Errors */}
            {analysis.potential_errors && (
              <div style={{ background: "rgba(255,60,60,0.05)", border: "1px solid rgba(255,60,60,0.2)", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
                <h3 style={{ fontWeight: "700", marginBottom: "12px", color: "#ff6b6b" }}>⚠️ Potential Errors Found</h3>
                <p style={{ color: "#ccc", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{analysis.potential_errors}</p>
              </div>
            )}

            {/* Negotiation Tips */}
            {analysis.negotiation_tips && (
              <div style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
                <h3 style={{ fontWeight: "700", marginBottom: "12px", color: "#00d4ff" }}>💬 Negotiation Tips</h3>
                <p style={{ color: "#ccc", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{analysis.negotiation_tips}</p>
              </div>
            )}

            {/* Next Steps */}
            {analysis.next_steps && (
              <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
                <h3 style={{ fontWeight: "700", marginBottom: "12px", color: "#7B2FBE" }}>🚀 Your Next Steps</h3>
                <p style={{ color: "#ccc", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{analysis.next_steps}</p>
              </div>
            )}

            {/* Dispute Letter */}
            {analysis.dispute_letter && (
              <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
                <h3 style={{ fontWeight: "700", marginBottom: "12px" }}>📝 Ready-to-Send Letter</h3>
                <div style={{ background: "#0a0a0a", borderRadius: "10px", padding: "20px", color: "#ddd", fontSize: "14px", lineHeight: "1.8", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                  {analysis.dispute_letter}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(analysis.dispute_letter)}
                  style={{ marginTop: "16px", background: "transparent", border: "1px solid #333", color: "#aaa", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}
                >
                  📋 Copy Letter
                </button>
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button
                onClick={() => { setStep(1); setForm({ user_name: "", user_email: "", bill_type: "Medical Bill", raw_text: "", provider_name: "", service_date: "", total_billed: "", total_owed: "" }); setAnalysis(null); }}
                style={{ flex: 1, background: "transparent", border: "1px solid #333", color: "#aaa", padding: "14px", borderRadius: "12px", cursor: "pointer", fontWeight: "600" }}
              >
                Analyze Another Bill
              </button>
              <button
                onClick={() => navigate("/MedBillDashboard")}
                style={{ flex: 1, background: "linear-gradient(135deg, #00d4ff, #7B2FBE)", border: "none", color: "#fff", padding: "14px", borderRadius: "12px", fontWeight: "800", cursor: "pointer" }}
              >
                View My History
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
