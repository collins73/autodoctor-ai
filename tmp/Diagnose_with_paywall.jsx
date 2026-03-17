import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessage from '@/components/diagnostic/ChatMessage';
import NearbyShops from '@/components/diagnostic/NearbyShops';

const FUNCTIONS_BASE = 'https://rebel-ai-36e8d1bc.base44.app/functions';

const S = {
  card: { background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  cardPad: { padding: 24 },
  input: {
    width: '100%', background: '#120f22', border: '1.5px solid #2a1f4a', borderRadius: 12,
    color: '#f0eeff', padding: '12px 15px', fontSize: 14, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  label: { fontSize: 11, fontWeight: 700, color: '#7c6a9e', marginBottom: 6, display: 'block', letterSpacing: '0.5px', textTransform: 'uppercase' },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderRadius: 11, fontWeight: 600, fontSize: 14, cursor: 'pointer', border: 'none',
    background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff',
    boxShadow: '0 4px 18px rgba(124,58,237,0.35)', padding: '12px 22px', width: '100%',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: 'pointer',
    background: 'transparent', color: '#7c6a9e', border: '1.5px solid #2a1f4a', padding: '8px 16px',
  },
  chip: {
    background: '#1e1535', border: '1.5px solid #2a1f4a', borderRadius: 8,
    padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#9b7fd4', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
  },
};

const QUICK_CODES = [
  { code: 'P0300', label: 'P0300 · Misfire', color: '#fb923c' },
  { code: 'P0420', label: 'P0420 · Catalytic', color: '#fbbf24' },
  { code: 'P0171', label: 'P0171 · Lean Fuel', color: '#fbbf24' },
  { code: 'P0128', label: 'P0128 · Thermostat', color: '#4ade80' },
  { code: 'B0001', label: 'B0001 · Airbag', color: '#f87171' },
];

const sevColors = { Low: '#4ade80', Medium: '#fbbf24', High: '#fb923c', Critical: '#f87171' };

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
          <div style={{ fontSize: 16, fontWeight: 800, color: '#4ade80' }}>${diagnosis.estimated_cost_low}–${diagnosis.estimated_cost_high}</div>
        </div>
        <div style={{ background: '#18122b', borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#7c6a9e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Shop Time</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#60a5fa' }}>{diagnosis.shop_time_hours}h</div>
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

      {diagnosis.parts_likely_involved?.length > 0 && (
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
          {trialInfo.remaining > 0
            ? `${trialInfo.remaining} free diagnosis${trialInfo.remaining === 1 ? '' : 'es'} remaining`
            : 'Trial ended — upgrade to continue'}
        </div>
      )}
    </div>
  );
}

export default function Diagnose() {
  const [step, setStep] = useState(1);
  const [vehicle, setVehicle] = useState({ year: '', make: '', model: '', mileage: '', name: '', location: '' });
  const [faultCode, setFaultCode] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [trialInfo, setTrialInfo] = useState(null);
  const [upgrading, setUpgrading] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const conversationRef = useRef(null);
  const messagesEndRef = useRef(null);

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      try { return await base44.entities.Vehicle.list('-created_date'); }
      catch { return []; }
    },
  });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { fetchTrialStatus(); }, []);

  useEffect(() => {
    if (!conversationId) return;
    const unsub = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsub();
  }, [conversationId]);

  async function fetchTrialStatus() {
    try {
      const token = await base44.auth.token();
      const res = await fetch(`${FUNCTIONS_BASE}/checkTrialStatus`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTrialInfo(data);
    } catch (e) {
      console.error('Trial check failed', e);
    }
  }

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const token = await base44.auth.token();
      const res = await fetch(`${FUNCTIONS_BASE}/createCheckout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error('Upgrade failed', e);
    }
    setUpgrading(false);
  }

  const isPro = trialInfo?.subscription_status === 'active';
  const isExhausted = trialInfo?.trial_exhausted;
  const remaining = trialInfo?.remaining ?? null;
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
      setError('Your free trial has ended. Please upgrade to continue.');
      return;
    }
    setError(null);
    setStep(3);
    setIsSending(true);

    try {
      const savedVehicle = vehicles.find(v => v.id === selectedVehicleId);
      const vehicleDesc = savedVehicle
        ? `${savedVehicle.year} ${savedVehicle.make} ${savedVehicle.model}`
        : `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

      const token = await base44.auth.token();

      // Step 1: Call interpretFaultCode — increments trial counter + gets AI diagnosis
      const interpRes = await fetch(`${FUNCTIONS_BASE}/interpretFaultCode`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fault_code: faultCode.toUpperCase(),
          year: vehicle.year || savedVehicle?.year,
          make: vehicle.make || savedVehicle?.make,
          model: vehicle.model || savedVehicle?.model,
          mileage: vehicle.mileage || savedVehicle?.mileage,
        }),
      });

      const interpData = await interpRes.json();

      // Handle trial exhausted from server
      if (interpRes.status === 403 && interpData.error === 'trial_exhausted') {
        setTrialInfo(prev => ({ ...prev, trial_exhausted: true, remaining: 0, can_diagnose: false }));
        setStep(2);
        setError('Your free trial has ended. Upgrade to Pro to continue.');
        setIsSending(false);
        return;
      }

      if (!interpRes.ok || !interpData.success) {
        throw new Error(interpData.error || 'Diagnosis failed');
      }

      const diagnosisResult = interpData.diagnosis;
      setDiagnosis(diagnosisResult);

      // Update local trial info from response
      if (interpData.trial_info) {
        setTrialInfo(prev => ({ ...prev, ...interpData.trial_info, subscription_status: prev?.subscription_status }));
      }

      // Step 2: Start conversation with the diagnosis result as context
      const conversation = await base44.agents.createConversation({
        agent_name: 'vehicle_diagnostic',
        metadata: { name: `${vehicleDesc} · ${faultCode.toUpperCase()}` },
      });
      conversationRef.current = conversation;
      setConversationId(conversation.id);

      // Seed the conversation with the structured diagnosis so the AI has full context
      const contextPrompt = `I just diagnosed fault code ${faultCode.toUpperCase()} on a ${vehicleDesc}${vehicle.mileage ? ` with ${vehicle.mileage} miles` : ''}${vehicle.location ? `, located in ${vehicle.location}` : ''}.

Here is the diagnosis:
- Fault: ${diagnosisResult.fault_description}
- Severity: ${diagnosisResult.severity}
- Explanation: ${diagnosisResult.plain_english_explanation}
- If ignored: ${diagnosisResult.consequences_if_ignored}
- Recommended action: ${diagnosisResult.recommended_action}
- Est. cost: $${diagnosisResult.estimated_cost_low}–$${diagnosisResult.estimated_cost_high}
- Parts involved: ${(diagnosisResult.parts_likely_involved || []).join(', ')}

Please confirm this diagnosis and let me know if I have any follow-up questions.`;

      await base44.agents.addMessage(conversation, { role: 'user', content: contextPrompt });
      setStep(4);
    } catch (e) {
      setError(e.message || 'Failed to start diagnostic. Please try again.');
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
    } catch {
      setError('Failed to send message.');
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

  // HARD GATE
  if (trialInfo && isExhausted && !isPro) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 24 }}>
        <div style={{ background: '#18122b', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 24, padding: 36, maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, background: 'linear-gradient(135deg,#fb923c,#f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Free Trial Ended
          </div>
          <div style={{ fontSize: 14, color: '#888', marginBottom: 28, lineHeight: 1.6 }}>
            You've used all 5 free diagnostics. Upgrade to Pro for unlimited fault code analysis, cost estimates, and shop finder.
          </div>
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
      </motion.div>
    );
  }

  return (
    <div>
      {/* Trial usage bar */}
      {trialInfo && !isPro && !isExhausted && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'linear-gradient(135deg,rgba(251,146,60,0.1),rgba(251,191,36,0.05))', border: '1px solid rgba(251,146,60,0.3)', borderRadius: 12, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚡</span>
            <span style={{ fontSize: 13, color: '#fdba74', fontWeight: 600 }}>{remaining} free diagnosis{remaining === 1 ? '' : 'es'} remaining</span>
          </div>
          <button onClick={handleUpgrade} disabled={upgrading}
            style={{ ...S.btnGhost, borderColor: 'rgba(251,146,60,0.4)', color: '#fb923c', fontSize: 12, padding: '6px 14px' }}>
            {upgrading ? '...' : 'Upgrade →'}
          </button>
        </motion.div>
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
                boxShadow: stepActive(n) ? '0 0 0 4px rgba(168,85,247,0.1)' : 'none',
              }}>{stepDone(n) ? '✓' : n}</div>
              <div style={{ fontSize: 10, fontWeight: 600, marginTop: 5, color: stepDone(n) ? '#22c55e' : stepActive(n) ? '#c084fc' : '#7c6a9e' }}>
                {['Vehicle', 'Fault Code', 'Analysis', 'Results'][n - 1]}
              </div>
            </div>
            {i < 3 && <div style={{ width: 40, height: 2, background: stepDone(n) ? '#22c55e' : '#2a1f4a', flexShrink: 0, margin: '0 4px 16px' }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={S.card}><div style={S.cardPad}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Tell me about your vehicle</div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>I'll calibrate cost estimates and find shops near you.</div>
            {vehicles.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>Or select a saved vehicle</label>
                <select style={{ ...S.input, cursor: 'pointer' }} value={selectedVehicleId}
                  onChange={e => {
                    const id = e.target.value; setSelectedVehicleId(id);
                    const v = vehicles.find(x => x.id === id);
                    if (v) setVehicle(prev => ({ ...prev, year: String(v.year || ''), make: v.make || '', model: v.model || '', mileage: String(v.mileage || '') }));
                  }}>
                  <option value="">— Manual entry —</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
                </select>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              {[['Year', 'year', '2021'], ['Make', 'make', 'Toyota'], ['Model', 'model', 'Camry']].map(([lbl, key, ph]) => (
                <div key={key}><label style={S.label}>{lbl}</label><input style={S.input} placeholder={ph} value={vehicle[key]} onChange={e => setVehicle(p => ({ ...p, [key]: e.target.value }))} /></div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={S.label}>Mileage</label><input style={S.input} type="number" placeholder="58,000" value={vehicle.mileage} onChange={e => setVehicle(p => ({ ...p, mileage: e.target.value }))} /></div>
              <div><label style={S.label}>Your Name</label><input style={S.input} placeholder="First name" value={vehicle.name} onChange={e => setVehicle(p => ({ ...p, name: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Location (City, State)</label>
              <input style={S.input} placeholder="e.g. Atlanta, GA" value={vehicle.location} onChange={e => setVehicle(p => ({ ...p, location: e.target.value }))} />
            </div>
            {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button style={S.btnPrimary} onClick={goToStep2}>Continue →</button>
          </div></div>
        </motion.div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={S.card}><div style={S.cardPad}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Enter your fault code</div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>From your dashboard warning light or OBD-II scanner.</div>
            <input style={{ ...S.input, textAlign: 'center', fontSize: 26, fontWeight: 800, letterSpacing: 6, textTransform: 'uppercase', padding: 18 }}
              placeholder="P0300" maxLength={6} value={faultCode} onChange={e => setFaultCode(e.target.value.toUpperCase())} />
            <div style={{ marginTop: 16 }}>
              <label style={S.label}>Quick picks</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {QUICK_CODES.map(c => (
                  <button key={c.code} style={S.chip} onClick={() => setFaultCode(c.code)}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, display: 'inline-block' }} />{c.label}
                  </button>
                ))}
              </div>
            </div>
            {error && <p style={{ color: '#f87171', fontSize: 13, marginTop: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button style={S.btnGhost} onClick={() => { setStep(1); setError(null); }}>← Back</button>
              <button style={{ ...S.btnPrimary, flex: 1 }} onClick={runDiagnostic}>⚡ Run Diagnostic</button>
            </div>
          </div></div>
        </motion.div>
      )}

      {/* Step 3 - Loading */}
      {step === 3 && (
        <div style={S.card}>
          <div style={{ textAlign: 'center', padding: '56px 24px' }}>
            <div style={{ width: 52, height: 52, margin: '0 auto 24px', borderRadius: '50%', border: '3px solid #2a2a2a', borderTopColor: '#f97316', animation: 'spin 0.7s linear infinite' }} />
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Decoding fault code {faultCode}…</div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>Connecting to AI diagnostic engine</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
              {['🔍 Reading fault code database', '💰 Estimating repair costs', '📍 Finding shops near you'].map((t, i) => (
                <div key={i} style={{ background: '#181818', border: '1px solid #2a2a2a', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 10, opacity: 0.5, fontSize: 14 }}>{t}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 4 - Results */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

          {/* Structured diagnosis card */}
          <DiagnosisCard diagnosis={diagnosis} trialInfo={trialInfo} />

          {/* Chat card for follow-up questions */}
          <div style={S.card}>
            <div style={{
              padding: '16px 24px', borderBottom: '1px solid #2a1f4a',
              background: 'linear-gradient(135deg,rgba(124,58,237,0.08),rgba(168,85,247,0.08))',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#c4b5fd' }}>Ask a follow-up</div>
                <div style={{ fontSize: 12, color: '#7c6a9e', marginTop: 2 }}>Your AI mechanic is standing by</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4ade80' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'pulseDot 2s infinite' }} />
                AI Mechanic
              </div>
            </div>

            <div style={{ padding: '20px 24px', minHeight: 200, maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <AnimatePresence>
                {messages.filter(m => !m.content?.startsWith('I just diagnosed')).map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <ChatMessage message={msg} />
                  </motion.div>
                ))}
              </AnimatePresence>
              {isSending && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#666', fontSize: 13 }}>
                  <Loader2 style={{ width: 16, height: 16, color: '#a855f7', animation: 'spin 0.7s linear infinite' }} />
                  Analyzing…
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {error && (
              <div style={{ margin: '0 24px', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#f87171', fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ padding: '16px 24px', borderTop: '1px solid #2a1f4a' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...S.input, flex: 1, height: 48 }}
                  placeholder="e.g. Can I drive with this code?"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  disabled={isSending}
                />
                <button onClick={sendMessage} disabled={!input.trim() || isSending}
                  style={{ ...S.btnPrimary, width: 48, height: 48, padding: 0, borderRadius: 12, flexShrink: 0, opacity: (!input.trim() || isSending) ? 0.5 : 1 }}>
                  <Send style={{ width: 18, height: 18 }} />
                </button>
              </div>
            </div>
          </div>

          <NearbyShops
            location={vehicle.location}
            faultCode={faultCode}
            vehicleSummary={`${vehicle.year} ${vehicle.make} ${vehicle.model}`.trim()}
          />

          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button style={{ ...S.btnGhost, margin: '0 auto' }} onClick={reset}>← New Diagnosis</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
