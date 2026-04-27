import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MedBillLanding() {
  const navigate = useNavigate();

  const stats = [
    { number: "80%", label: "of medical bills contain errors" },
    { number: "32%", label: "of Americans can't read their bill" },
    { number: "$1,300", label: "average overcharge per patient" },
    { number: "50%", label: "don't know they can negotiate" },
  ];

  const steps = [
    { icon: "📄", title: "Upload or Paste", desc: "Drop in your medical bill, EOB, or hospital statement" },
    { icon: "🤖", title: "AI Analyzes", desc: "Our AI scans for errors, overcharges, and confusing charges" },
    { icon: "💡", title: "Get Clarity", desc: "Receive a plain-English breakdown of every line item" },
    { icon: "💰", title: "Save Money", desc: "Use your dispute letter and negotiation tips to fight back" },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid #1a1a1a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "28px" }}>🏥</span>
          <span style={{ fontSize: "22px", fontWeight: "800", background: "linear-gradient(135deg, #00d4ff, #7B2FBE)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ClearBill AI
          </span>
        </div>
        <button
          onClick={() => navigate("/MedBillAnalyzer")}
          style={{ background: "linear-gradient(135deg, #00d4ff, #7B2FBE)", border: "none", color: "#fff", padding: "10px 24px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}
        >
          Analyze My Bill →
        </button>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "80px 20px 60px" }}>
        <div style={{ display: "inline-block", background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", borderRadius: "20px", padding: "6px 16px", fontSize: "13px", color: "#00d4ff", marginBottom: "24px" }}>
          ⚡ AI-Powered Medical Bill Analysis
        </div>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: "900", lineHeight: "1.1", marginBottom: "20px" }}>
          Stop Overpaying<br />
          <span style={{ background: "linear-gradient(135deg, #00d4ff, #7B2FBE)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Your Medical Bills
          </span>
        </h1>
        <p style={{ fontSize: "20px", color: "#aaa", maxWidth: "600px", margin: "0 auto 40px", lineHeight: "1.6" }}>
          Paste your confusing medical bill or EOB. Get a plain-English breakdown, error flags, and a ready-to-send dispute letter in seconds.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/MedBillAnalyzer")}
            style={{ background: "linear-gradient(135deg, #00d4ff, #7B2FBE)", border: "none", color: "#fff", padding: "16px 36px", borderRadius: "12px", fontWeight: "800", cursor: "pointer", fontSize: "18px" }}
          >
            🔍 Analyze My Bill Free
          </button>
          <button
            onClick={() => navigate("/MedBillDashboard")}
            style={{ background: "transparent", border: "2px solid #333", color: "#fff", padding: "16px 36px", borderRadius: "12px", fontWeight: "700", cursor: "pointer", fontSize: "18px" }}
          >
            View My History
          </button>
        </div>
        <p style={{ color: "#555", fontSize: "13px", marginTop: "16px" }}>No account required. First analysis free.</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", maxWidth: "900px", margin: "0 auto 80px", padding: "0 20px" }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "16px", padding: "28px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "42px", fontWeight: "900", background: "linear-gradient(135deg, #00d4ff, #7B2FBE)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.number}</div>
            <div style={{ color: "#888", fontSize: "14px", marginTop: "8px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div style={{ maxWidth: "900px", margin: "0 auto 80px", padding: "0 20px" }}>
        <h2 style={{ textAlign: "center", fontSize: "36px", fontWeight: "800", marginBottom: "48px" }}>How It Works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "16px", padding: "28px 20px", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>{s.icon}</div>
              <div style={{ fontWeight: "700", fontSize: "16px", marginBottom: "8px" }}>{s.title}</div>
              <div style={{ color: "#888", fontSize: "14px", lineHeight: "1.5" }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center", background: "linear-gradient(135deg, rgba(0,212,255,0.1), rgba(123,47,190,0.1))", border: "1px solid #1e1e1e", borderRadius: "24px", padding: "60px 20px", maxWidth: "700px", margin: "0 auto 60px" }}>
        <h2 style={{ fontSize: "36px", fontWeight: "800", marginBottom: "16px" }}>Ready to fight back?</h2>
        <p style={{ color: "#aaa", marginBottom: "32px", fontSize: "18px" }}>Join thousands of Americans taking control of their medical bills.</p>
        <button
          onClick={() => navigate("/MedBillAnalyzer")}
          style={{ background: "linear-gradient(135deg, #00d4ff, #7B2FBE)", border: "none", color: "#fff", padding: "18px 48px", borderRadius: "12px", fontWeight: "800", cursor: "pointer", fontSize: "20px" }}
        >
          Get My Free Analysis →
        </button>
      </div>

      <div style={{ textAlign: "center", color: "#444", fontSize: "13px", padding: "20px" }}>
        © 2026 ClearBill AI — Not a licensed medical billing service. For informational purposes only.
      </div>
    </div>
  );
}
