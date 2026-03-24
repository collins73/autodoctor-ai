import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const FUNCTIONS_BASE = 'https://rebel-ai-36e8d1bc.base44.app/functions';

// ─── Safe token getter — never throws ───────────────────────────────────────
async function getToken() {
  try {
    if (typeof base44?.auth?.token === 'function') return await base44.auth.token();
    if (base44?.auth?.token && typeof base44.auth.token === 'string') return base44.auth.token;
    if (base44?._token) return base44._token;
    return localStorage.getItem('base44_token') || '';
  } catch {
    return '';
  }
}

// ─── Safe fetch wrapper — never throws, always returns an object ─────────────
async function callFunction(path, method = 'GET', body = null) {
  try {
    const token = await getToken();
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${FUNCTIONS_BASE}/${path}`, opts);
    const text = await res.text();
    try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
    catch { return { ok: false, status: res.status, data: { error: text } }; }
  } catch (e) {
    return { ok: false, status: 0, data: { error: e?.message || 'Network error' } };
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
  card: { background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  cardPad: { padding: 24 },
  input: { width: '100%', background: '#120f22', border: '1.5px solid #2a1f4a', borderRadius: 12, color: '#f0eeff', padding: '12px 15px', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  label: { fontSize: 11, fontWeight: 700, color: '#7c6a9e', marginBottom: 6, display: 'block', letterSpacing: '0.5px', textTransform: 'uppercase' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 11, fontWeight: 600, fontSize: 14, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', boxShadow: '0 4px 18px rgba(124,58,237,0.35)', padding: '12px 22px', width: '100%' },
  btnGhost: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: 'pointer', background: 'transparent', color: '#7c6a9e', border: '1.5px solid #2a1f4a', padding: '8px 16px' },
  chip: { background: '#1e1535', border: '1.5px solid #2a1f4a', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#9b7fd4', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 },
};

const QUICK_CODES = [
  { code: 'P0300', label: 'P0300 · Misfire', color: '#fb923c' },
  { code: 'P0420', label: 'P0420 · Catalytic', color: '#fbbf24' },
  { code: 'P0171', label: 'P0171 · Lean Fuel', color: '#fbbf24' },
  { code: 'P0128', label: 'P0128 · Thermostat', color: '#4ade80' },
  { code: 'B0001', label: 'B0001 · Airbag', color: '#f87171' },
];

const sevColors = { Low: '#4ade80', Medium: '#fbbf24', High: '#fb923c', Critical: '#f87171' };

// ─── Error Boundary ──────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('[Diagnose] Caught error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f87171', marginBottom: 8 }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>{this.state.error?.message || 'Unknown error'}</div>
          <button onClick={() => this.setState({ hasError: false, error: null })}
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Diagnosis Result Card ───────────────────────────────────────────────────
function DiagnosisCard({ diagnosis, trialInfo }) {
  if (!diagnosis) return null;
  const sev = diagnosis.severity || 'Medium';
  const color = sevColors[sev] || '#fbbf24';
  return (
    <div style={{ background: '#120f22', border: `1px solid ${color}40`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, color: '#f0eeff' }}>{diagnosis.fault_code}</div>
        <span style={{ fontSize: 12, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}40`, borderRadius: 20, padding: '3px 12px' }}>{sev}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#c4b5fd', marginBottom: 6 }}>{diagnosis.fault_description}</div>
      <div style={{ fontSize: 13, color: '#a0a0b8', lineHeight: 1.6, marginBottom: 14 }}>{diagnosis.plain_english_explanation}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div style={{ background: '#18122b', borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#7c6a9e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Est. Repair Cost</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#4ade80' }}>${diagnosis.estimated_cost_low ?? '?'}–${diagnosis.estimated_cost_high ?? '?'}</div>
        </div>
        <div style={{ background: '#18122b', borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#7c6a9e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Action</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa' }}>{diagnosis.recommended_action ? 'See below ↓' : 'N/A'}</div>
        </div>
      </div>

      {diagnosis.consequences_if_ignored && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚠️ If Ignored</div>
          <div style={{ fontSize: 13, color: '#fca5a5' }}>{diagnosis.consequences_if_ignored}</div>
        </div>
      )}

      {diagnosis.recommended_action && (
        <div style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>✅ Recommended Action</div>
          <div style={{ fontSize: 13, color: '#86efac' }}>{diagnosis.recommended_action}</div>
        </div>
      )}

      {Array.isArray(diagnosis.parts_likely_involved) && diagnosis.parts_likely_involved.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7c6a9e', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Parts Involved</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {diagnosis.parts_likely_involved.map((p, i) => (
              <span key={i} style={{ background: '#1e1535', border: '1px solid #2a1f4a', borderRadius: 6, padding: '3px 10px', fontSize: 12, color: '#9b7fd4' }}>{p}</span>
            ))}
          </div>
        </div>
      )}

      {trialInfo && trialInfo.subscription_status !== 'active' && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #2a1f4a', fontSize: 12, color: '#666', textAlign: 'center' }}>
          {(trialInfo.remaining ?? 0) > 0
            ? `${trialInfo.remaining} free diagnosis${trialInfo.remaining === 1 ? '' : 'es'} remaining`
            : 'Trial ended — upgrade to continue'}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
function DiagnoseInner() {
  const [step, setStep] = useState(1);
  const [vehicle, setVehicle] = useState({ year: '', make: '', model: '', mileage: '', name: '', location: '' });
  const [faultCode, setFaultCode] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [trialInfo, setTrialInfo] = useState({ can_diagnose: true, trial_exhausted: false, remaining: 5, subscription_status: 'trial' });
  const [upgrading, setUpgrading] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const conversationRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ── Safe vehicle query ──
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      try { return await base44.entities.Vehicle.list('-created_date'); }
      catch { return []; }
    },
  });

  useEffect(() => { try { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); } catch {} }, [messages]);
  useEffect(() => { fetchTrialStatus(); }, []);

  // ── Conversation subscription ──
  useEffect(() => {
    if (!conversationId) return;
    let unsub;
    try {
      unsub = base44.agents.subscribeToConversation(conversationId, (data) => {
        try { setMessages(data?.messages || []); } catch {}
      });
    } catch (e) {
      console.error('[Diagnose] Subscription failed:', e);
    }
    return () => { try { unsub?.(); } catch {} };
  }, [conversationId]);

  // ── Trial status ──
  async function fetchTrialStatus() {
    const result = await callFunction('checkTrialStatus');
    if (result.ok && result.data?.success) {
      setTrialInfo(result.data);
    }
    // if it fails, keep default — app still works
  }

  // ── Upgrade ──
  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const result = await callFunction('createCheckout', 'POST', {});
      if (result.data?.url) {
        window.location.href = result.data.url;
      } else {
        setError('Could not start checkout. Please try again.');
      }
    } catch (e) {
      setError('Upgrade failed. Please try again.');
    }
    setUpgrading(false);
  }

  const isPro = trialInfo?.subscription_status === 'active';
  const isExhausted = trialInfo?.trial_exhausted;
  const remaining = trialInfo?.remaining ?? 5;
  const canDiagnose = trialInfo?.can_diagnose !== false;

  const goToStep2 = () => {
    if (!vehicle.year || !vehicle.make || !vehicle.model || !vehicle.location) {
      setError('Please fill in Year, Make, Model and Location'); return;
    }
    setError(null);
    setStep(2);
  };

  const runDiagnostic = async () => {
    if (!faultCode.trim() || faultCode.trim().length < 4) {
      setError('Enter a valid fault code (e.g. P0300)'); return;
    }
    if (!canDiagnose) {
      setError('Your free trial has ended. Please upgrade to continue.'); return;
    }
    setError(null);
    setStep(3);
    setIsSending(true);

    try {
      const savedVehicle = vehicles.find(v => v.id === selectedVehicleId);
      const vehicleDesc = savedVehicle
        ? `${savedVehicle.year} ${savedVehicle.make} ${savedVehicle.model}`
        : `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

      // Call interpretFaultCode
      const interpResult = await callFunction('interpretFaultCode', 'POST', {
        fault_code: faultCode.toUpperCase(),
        year: vehicle.year || savedVehicle?.year,
        make: vehicle.make || savedVehicle?.make,
        model: vehicle.model || savedVehicle?.model,
        mileage: vehicle.mileage || savedVehicle?.mileage,
      });

      if (interpResult.status === 403 && interpResult.data?.error === 'trial_exhausted') {
        setTrialInfo(prev => ({ ...prev, trial_exhausted: true, remaining: 0, can_diagnose: false }));
        setStep(2);
        setError('Your free trial has ended. Upgrade to Pro to continue.');
        setIsSending(false);
        return;
      }

      if (!interpResult.ok || !interpResult.data?.success) {
        throw new Error(interpResult.data?.error || 'Diagnosis failed. Please try again.');
      }

      const diagnosisResult = interpResult.data.diagnosis;
      setDiagnosis(diagnosisResult);

      if (interpResult.data.trial_info) {
        setTrialInfo(prev => ({ ...prev, ...interpResult.data.trial_info }));
      }

      // Start AI conversation
      let conversation = null;
      try {
        conversation = await base44.agents.createConversation({
          agent_name: 'vehicle_diagnostic',
          metadata: { name: `${vehicleDesc} · ${faultCode.toUpperCase()}` },
        });
        conversationRef.current = conversation;
        setConversationId(conversation.id);

        const contextPrompt = `I just diagnosed fault code ${faultCode.toUpperCase()} on a ${vehicleDesc}${vehicle.mileage ? ` with ${vehicle.mileage} miles` : ''}${vehicle.location ? `, located in ${vehicle.location}` : ''}.

Diagnosis summary:
- Fault: ${diagnosisResult?.fault_description || 'N/A'}
- Severity: ${diagnosisResult?.severity || 'N/A'}
- Explanation: ${diagnosisResult?.plain_english_explanation || 'N/A'}
- If ignored: ${diagnosisResult?.consequences_if_ignored || 'N/A'}
- Recommended action: ${diagnosisResult?.recommended_action || 'N/A'}
- Est. cost: $${diagnosisResult?.estimated_cost_low ?? '?'}–$${diagnosisResult?.estimated_cost_high ?? '?'}

Please confirm this diagnosis and answer any follow-up questions.`;

        await base44.agents.addMessage(conversation, { role: 'user', content: contextPrompt });
      } catch (convErr) {
        console.error('[Diagnose] Conversation failed:', convErr);
        // Still show results even if chat fails
      }

      setStep(4);
    } catch (e) {
      console.error('[Diagnose] runDiagnostic error:', e);
      setError(e?.message || 'Diagnostic failed. Please try again.');
      setStep(2);
    } finally {
      setIsSending(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isSending || !conversationRef.current) return;
    const msg = input.trim();
    setInput('');
    setIsSending(true);
    try {
      await base44.agents.addMessage(conversationRef.current, { role: 'user', content: msg });
    } catch (e) {
      console.error('[Diagnose] sendMessage error:', e);
      setError('Failed to send message. Please try again.');
      setInput(msg);
    } finally {
      setIsSending(false);
    }
  };

  const reset = () => {
    setStep(1);
    setVehicle({ year: '', make: '', model: '', mileage: '', name: '', location: '' });
    setFaultCode(''); setConversationId(null); setMessages([]); setInput('');
    setError(null); setSelectedVehicleId(''); setDiagnosis(null);
    conversationRef.current = null;
    fetchTrialStatus();
  };

  const stepDone = (n) => step > n;
  const stepActive = (n) => step === n;

  // ── Hard paywall gate ──
  if (isExhausted && !isPro) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 24 }}>
        <div style={{ background: '#18122b', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 24, padding: 36, maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, background: 'linear-gradient(135deg,#fb923c,#f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Free Trial Ended</div>
          <div style={{ fontSize: 14, color: '#888', marginBottom: 28, lineHeight: 1.6 }}>You've used all 5 free diagnostics. Upgrade to Pro for unlimited access.</div>
          <div style={{ background: '#120f22', borderRadius: 16, padding: 20, marginBottom: 24, textAlign: 'left' }}>
            {['⚡ Unlimited diagnostics', '💰 Repair cost estimates', '📍 Nearby shop finder', '📋 Full history & reports', '🤖 AI follow-up questions'].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13, color: '#c4b5fd' }}>
                <span style={{ color: '#4ade80' }}>✓</span> {f}
              </div>
            ))}
          </div>
          <button onClick={handleUpgrade} disabled={upgrading}
            style={{ ...S.btnPrimary, background: 'linear-gradient(135deg,#fb923c,#f87171)', boxShadow: '0 4px 18px rgba(251,146,60,0.35)', fontSize: 16, padding: '14px 28px', opacity: upgrading ? 0.7 : 1 }}>
            {upgrading ? 'Loading...' : '🚀 Upgrade to Pro'}
          </button>
          <div style={{ fontSize: 12, color: '#555', marginTop: 12 }}>Cancel anytime · Secure payment via Stripe</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Trial usage banner */}
      {!isPro && !isExhausted && (
        <div style={{ background: 'linear-gradient(135deg,rgba(251,146,60,0.1),rgba(251,191,36,0.05))', border: '1px solid rgba(251,146,60,0.3)', borderRadius: 12, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚡</span>
            <span style={{ fontSize: 13, color: '#fdba74', fontWeight: 600 }}>{remaining} free diagnosis{remaining === 1 ? '' : 'es'} remaining</span>
          </div>
          <button onClick={handleUpgrade} disabled={upgrading} style={{ ...S.btnGhost, borderColor: 'rgba(251,146,60,0.4)', color: '#fb923c', fontSize: 12, padding: '6px 14px' }}>
            {upgrading ? '...' : 'Upgrade →'}
          </button>
        </div>
      )}

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28 }}>
        {[1, 2, 3, 4].map((n, i) => (
          <React.Fragment key={n}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, margin: '0 auto',
                border: stepDone(n) ? '2px solid #22c55e' : stepActive(n) ? '2px solid #a855f7' : '2px solid #2a1f4a',
                background: stepDone(n) ? 'rgba(34,197,94,0.15)' : stepActive(n) ? 'rgba(168,85,247,0.12)' : '#18122b',
                color: stepDone(n) ? '#22c55e' : stepActive(n) ? '#c084fc' : '#7c6a9e',
              }}>
                {stepDone(n) ? '✓' : n}
              </div>
              <div style={{ fontSize: 10, color: stepActive(n) ? '#c084fc' : '#555', marginTop: 4 }}>
                {['Vehicle', 'Code', 'Analyzing', 'Results'][n - 1]}
              </div>
            </div>
            {i < 3 && <div style={{ width: 40, height: 1, background: stepDone(n) ? '#22c55e' : '#2a1f4a', margin: '0 4px', marginBottom: 20 }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#fca5a5' }}>⚠️ {error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* ── STEP 1: Vehicle ── */}
      {step === 1 && (
        <div style={S.card}>
          <div style={S.cardPad}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Tell me about your vehicle</div>
            <div style={{ fontSize: 13, color: '#7c6a9e', marginBottom: 20 }}>I'll calibrate cost estimates and find shops near you.</div>

            {vehicles.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>Or select a saved vehicle</label>
                <select value={selectedVehicleId} onChange={e => {
                  setSelectedVehicleId(e.target.value);
                  if (e.target.value) {
                    const v = vehicles.find(x => x.id === e.target.value);
                    if (v) setVehicle(prev => ({ ...prev, year: v.year || '', make: v.make || '', model: v.model || '', mileage: v.mileage || '' }));
                  }
                }} style={S.input}>
                  <option value="">— Manual entry —</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              {['year', 'make', 'model'].map(f => (
                <div key={f}>
                  <label style={S.label}>{f.charAt(0).toUpperCase() + f.slice(1)}</label>
                  <input style={S.input} placeholder={f === 'year' ? '2021' : f === 'make' ? 'Toyota' : 'Camry'}
                    value={vehicle[f]} onChange={e => setVehicle(p => ({ ...p, [f]: e.target.value }))} />
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={S.label}>Mileage</label>
                <input style={S.input} placeholder="58,000" value={vehicle.mileage} onChange={e => setVehicle(p => ({ ...p, mileage: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>Your Name</label>
                <input style={S.input} placeholder="First name" value={vehicle.name} onChange={e => setVehicle(p => ({ ...p, name: e.target.value }))} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Location (City, State)</label>
              <input style={S.input} placeholder="e.g. Atlanta, GA" value={vehicle.location} onChange={e => setVehicle(p => ({ ...p, location: e.target.value }))} />
            </div>

            <button onClick={goToStep2} style={S.btnPrimary}>Continue →</button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Fault Code ── */}
      {step === 2 && (
        <div style={S.card}>
          <div style={S.cardPad}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Enter your fault code</div>
            <div style={{ fontSize: 13, color: '#7c6a9e', marginBottom: 20 }}>From your OBD-II scanner or check engine light reader.</div>

            <input
              style={{ ...S.input, textAlign: 'center', fontSize: 26, fontWeight: 800, letterSpacing: 6, textTransform: 'uppercase', padding: 18 }}
              placeholder="P0300"
              value={faultCode}
              maxLength={8}
              onChange={e => setFaultCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && runDiagnostic()}
            />


            {/* ── Scanner CTA ── */}
            <div style={{ background: 'linear-gradient(135deg,rgba(96,165,250,0.08),rgba(59,130,246,0.04))', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>🔌</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#93c5fd' }}>Don't have a scanner?</div>
                  <div style={{ fontSize: 11, color: '#4a6fa5' }}>Get a Bluetooth OBD-II reader for ~$20</div>
                </div>
              </div>
              <a href="https://www.amazon.com/s?k=obd2+bluetooth+scanner&tag=rebelauto-20" target="_blank" rel="noopener noreferrer"
                style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Shop Amazon →
              </a>
            </div>
            <div style={{ marginTop: 14, marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7c6a9e', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick select</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {QUICK_CODES.map(qc => (
                  <button key={qc.code} onClick={() => setFaultCode(qc.code)} style={{ ...S.chip, borderColor: faultCode === qc.code ? qc.color : '#2a1f4a', color: faultCode === qc.code ? qc.color : '#9b7fd4' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: qc.color, display: 'inline-block' }} />
                    {qc.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ ...S.btnGhost, flex: 1 }}>← Back</button>
              <button onClick={runDiagnostic} disabled={isSending} style={{ ...S.btnPrimary, flex: 2, opacity: isSending ? 0.7 : 1 }}>
                {isSending ? 'Analyzing...' : '⚡ Run Diagnostic'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Analyzing ── */}
      {step === 3 && (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ width: 56, height: 56, border: '3px solid #2a1f4a', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#c4b5fd', marginBottom: 8 }}>Analyzing {faultCode}...</div>
          <div style={{ fontSize: 13, color: '#7c6a9e' }}>Running AI diagnostics — this takes about 10 seconds</div>
        </div>
      )}

      {/* ── STEP 4: Results ── */}
      {step === 4 && (
        <div>
          <DiagnosisCard diagnosis={diagnosis} trialInfo={trialInfo} />

          {/* AI Chat */}
          {conversationId && (
            <div style={S.card}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a1f4a', fontSize: 14, fontWeight: 700 }}>🤖 Ask a follow-up question</div>
              <div style={{ maxHeight: 320, overflowY: 'auto', padding: 16 }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 24, color: '#7c6a9e', fontSize: 13 }}>AI is reviewing your diagnosis...</div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} style={{ marginBottom: 12, display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '80%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                      background: msg.role === 'user' ? 'rgba(124,58,237,0.25)' : '#18122b',
                      border: msg.role === 'user' ? '1px solid rgba(124,58,237,0.4)' : '1px solid #2a1f4a',
                      color: msg.role === 'user' ? '#e9d5ff' : '#c4b5fd',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid #2a1f4a', display: 'flex', gap: 10 }}>
                <input style={{ ...S.input, flex: 1 }} placeholder="Ask about this fault code..." value={input}
                  onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                <button onClick={sendMessage} disabled={isSending || !input.trim()}
                  style={{ ...S.btnPrimary, width: 44, padding: 0, flexShrink: 0, opacity: (isSending || !input.trim()) ? 0.5 : 1 }}>
                  {isSending ? '…' : '→'}
                </button>
              </div>
            </div>
          )}

          <button onClick={reset} style={{ ...S.btnGhost, width: '100%', marginTop: 8 }}>← Start New Diagnosis</button>
        </div>
      )}
    </div>
  );
}

export default function Diagnose() {
  return (
    <ErrorBoundary>
      <DiagnoseInner />
    </ErrorBoundary>
  );
}
