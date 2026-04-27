import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MedicalBill, BillAnalysis } from "@/api/entities";

export default function MedBillDashboard() {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [billData, analysisData] = await Promise.all([
        MedicalBill.list(),
        BillAnalysis.list(),
      ]);
      setBills(billData);
      setAnalyses(analysisData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const selectBill = (bill) => {
    setSelected(bill);
    const a = analyses.find(a => a.bill_id === bill.id);
    setSelectedAnalysis(a || null);
  };

  const statusColor = { pending: "#888", analyzed: "#00d4aa", disputed: "#ffa500", resolved: "#00d4ff" };
  const statusIcon = { pending: "⏳", analyzed: "✅", disputed: "⚠️", resolved: "🎉" };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid #1a1a1a" }}>
        <div onClick={() => navigate("/MedBillLanding")} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
          <span style={{ fontSize: "24px" }}>🏥</span>
          <span style={{ fontSize: "20px", fontWeight: "800", background: "linear-gradient(135deg, #00d4ff, #7B2FBE)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ClearBill AI</span>
        </div>
        <button
          onClick={() => navigate("/MedBillAnalyzer")}
          style={{ background: "linear-gradient(135deg, #00d4ff, #7B2FBE)", border: "none", color: "#fff", padding: "10px 20px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}
        >
          + Analyze New Bill
        </button>
      </nav>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 20px", display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: "24px" }}>

        {/* Bill List */}
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "24px" }}>My Bills ({bills.length})</h2>

          {loading && <div style={{ color: "#888", textAlign: "center", padding: "40px" }}>Loading...</div>}

          {!loading && bills.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "#111", borderRadius: "16px", border: "1px solid #1e1e1e" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
              <p style={{ color: "#888", marginBottom: "24px" }}>No bills analyzed yet.</p>
              <button onClick={() => navigate("/MedBillAnalyzer")} style={{ background: "linear-gradient(135deg, #00d4ff, #7B2FBE)", border: "none", color: "#fff", padding: "12px 28px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>
                Analyze My First Bill
              </button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {bills.map(bill => {
              const a = analyses.find(a => a.bill_id === bill.id);
              return (
                <div
                  key={bill.id}
                  onClick={() => selectBill(bill)}
                  style={{
                    background: selected?.id === bill.id ? "rgba(0,212,255,0.05)" : "#111",
                    border: `1px solid ${selected?.id === bill.id ? "rgba(0,212,255,0.4)" : "#1e1e1e"}`,
                    borderRadius: "14px",
                    padding: "20px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "16px", marginBottom: "4px" }}>
                        {bill.provider_name || "Unknown Provider"}
                      </div>
                      <div style={{ color: "#888", fontSize: "13px" }}>{bill.bill_type} • {bill.service_date || "No date"}</div>
                    </div>
                    <span style={{ color: statusColor[bill.status], fontSize: "12px", fontWeight: "600" }}>
                      {statusIcon[bill.status]} {bill.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "20px", marginTop: "14px" }}>
                    {bill.total_owed > 0 && <div><span style={{ color: "#555", fontSize: "12px" }}>You Owe</span><div style={{ color: "#ff6b6b", fontWeight: "700" }}>${bill.total_owed}</div></div>}
                    {a?.error_count > 0 && <div><span style={{ color: "#555", fontSize: "12px" }}>Errors</span><div style={{ color: "#ff6b6b", fontWeight: "700" }}>{a.error_count}</div></div>}
                    {a?.potential_savings > 0 && <div><span style={{ color: "#555", fontSize: "12px" }}>Potential Savings</span><div style={{ color: "#00d4aa", fontWeight: "700" }}>${a.potential_savings}</div></div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800" }}>Analysis Details</h2>
              <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer", fontSize: "20px" }}>✕</button>
            </div>

            {!selectedAnalysis && (
              <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "16px", padding: "40px", textAlign: "center" }}>
                <p style={{ color: "#888" }}>No analysis found for this bill.</p>
              </div>
            )}

            {selectedAnalysis && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: "900", color: "#ff6b6b" }}>{selectedAnalysis.error_count}</div>
                    <div style={{ color: "#888", fontSize: "11px" }}>Errors</div>
                  </div>
                  <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: "900", color: "#00d4ff" }}>${selectedAnalysis.potential_savings}</div>
                    <div style={{ color: "#888", fontSize: "11px" }}>Savings</div>
                  </div>
                  <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: "900", color: "#7B2FBE" }}>{selectedAnalysis.confidence_score}%</div>
                    <div style={{ color: "#888", fontSize: "11px" }}>Confidence</div>
                  </div>
                </div>

                {[
                  { label: "📋 Summary", content: selectedAnalysis.plain_english_summary, color: "#00d4ff" },
                  { label: "⚠️ Errors", content: selectedAnalysis.potential_errors, color: "#ff6b6b" },
                  { label: "💬 Negotiation Tips", content: selectedAnalysis.negotiation_tips, color: "#7B2FBE" },
                  { label: "🚀 Next Steps", content: selectedAnalysis.next_steps, color: "#00d4aa" },
                ].map((section, i) => section.content && (
                  <div key={i} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "14px", padding: "20px" }}>
                    <h4 style={{ color: section.color, marginBottom: "10px", fontWeight: "700" }}>{section.label}</h4>
                    <p style={{ color: "#ccc", fontSize: "14px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{section.content}</p>
                  </div>
                ))}

                {selectedAnalysis.dispute_letter && (
                  <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: "14px", padding: "20px" }}>
                    <h4 style={{ fontWeight: "700", marginBottom: "10px" }}>📝 Dispute Letter</h4>
                    <div style={{ background: "#0a0a0a", borderRadius: "8px", padding: "16px", color: "#ddd", fontSize: "13px", lineHeight: "1.8", whiteSpace: "pre-wrap", fontFamily: "monospace", maxHeight: "200px", overflowY: "auto" }}>
                      {selectedAnalysis.dispute_letter}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedAnalysis.dispute_letter)}
                      style={{ marginTop: "12px", background: "transparent", border: "1px solid #333", color: "#aaa", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}
                    >
                      📋 Copy Letter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
