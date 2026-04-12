import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const FUNCTIONS_BASE = 'https://rebel-ai-36e8d1bc.base44.app/functions';

// ─── Device detection ─────────────────────────────────────────────────────────
function detectDevice() {
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isChromeOrEdge = /Chrome|Edg/i.test(ua);
  const btSupported = typeof navigator !== 'undefined' && !!navigator.bluetooth && !isIOS;
  return { isIOS, isSafari, isAndroid, isChromeOrEdge, btSupported };
}

async function getToken() {
  try {
    if (typeof base44?.auth?.token === 'function') return await base44.auth.token();
    if (base44?.auth?.token && typeof base44.auth.token === 'string') return base44.auth.token;
    if (base44?._token) return base44._token;
    return localStorage.getItem('base44_token') || '';
  } catch { return ''; }
}

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

const S = {
  page: {
    minHeight: '100vh', background: '#0d0a1a', color: '#f0eeff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: '16px', WebkitTextSizeAdjust: '100%',
  },
  card: { background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  cardPad: { padding: 20 },
  input: {
    width: '100%', background: '#120f22', border: '1.5px solid #2a1f4a', borderRadius: 12,
    color: '#f0eeff', padding: '14px 15px', fontSize: 16, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
    WebkitAppearance: 'none', // prevents iOS zoom on focus
  },
  label: { fontSize: 11, fontWeight: 700, color: '#7c6a9e', marginBottom: 6, display: 'block', letterSpacing: '0.5px', textTransform: 'uppercase' },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer', border: 'none',
    background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff',
    boxShadow: '0 4px 18px rgba(124,58,237,0.35)', padding: '15px 22px', width: '100%',
    WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
  },
  btnBlue: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer', border: 'none',
    background: 'linear-gradient(135deg,#0ea5e9,#38bdf8)', color: '#fff',
    boxShadow: '0 4px 18px rgba(14,165,233,0.35)', padding: '15px 22px', width: '100%',
    WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderRadius: 14, fontWeight: 600, fontSize: 13, cursor: 'pointer',
    background: 'transparent', color: '#7c6a9e', border: '1.5px solid #2a1f4a', padding: '12px 16px',
    WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
  },
  chip: {
    background: '#1e1535', border: '1.5px solid #2a1f4a', borderRadius: 20,
    padding: '8px 14px', fontSize: 12, fontWeight: 600, color: '#9b7fd4',
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
    WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
  },
};

const sevColors = { Low: '#4ade80', Medium: '#fbbf24', High: '#fb923c', Critical: '#f87171' };

const QUICK_CODES = [
  { code: 'P0300', label: 'P0300 · Misfire', color: '#fb923c' },
  { code: 'P0420', label: 'P0420 · Catalytic', color: '#fbbf24' },
  { code: 'P0171', label: 'P0171 · Lean Fuel', color: '#fbbf24' },
  { code: 'P0128', label: 'P0128 · Thermostat', color: '#4ade80' },
  { code: 'B0001', label: 'B0001 · Airbag', color: '#f87171' },
];

// ─── ELM327 Bluetooth helpers (Android/Desktop Chrome only) ──────────────────
function parseDTCs(raw) {
  const codes = [];
  const lines = raw.split(/[\r\n]+/);
  for (const line of lines) {
    const clean = line.replace(/\s+/g, '').replace(/>/g, '');
    if (clean.startsWith('43') && clean.length >= 6) {
      const payload = clean.slice(2);
      for (let i = 0; i + 3 < payload.length; i += 4) {
        const b1 = parseInt(payload[i] + payload[i + 1], 16);
        const b2 = parseInt(payload[i + 2] + payload[i + 3], 16);
        if (b1 === 0 && b2 === 0) continue;
        const prefix = ['P', 'C', 'B', 'U'][(b1 >> 6) & 0x03];
        const d1 = ((b1 >> 4) & 0x03).toString();
        const d2 = (b1 & 0x0F).toString(16).toUpperCase();
        const d34 = b2.toString(16).toUpperCase().padStart(2, '0');
        codes.push(`${prefix}${d1}${d2}${d34}`);
      }
    }
  }
  return [...new Set(codes)];
}

function useBluetoothOBD() {
  const [btState, setBtState] = useState({ connected: false, status: 'idle', codes: [], rawLog: [], errorMsg: '' });
  const deviceRef = useRef(null);
  const charWriteRef = useRef(null);
  const charNotifyRef = useRef(null);
  const bufferRef = useRef('');
  const resolveRef = useRef(null);

  function log(line) { setBtState(p => ({ ...p, rawLog: [...p.rawLog.slice(-30), line] })); }

  function onNotify(e) {
    const text = new TextDecoder().decode(e.target.value);
    bufferRef.current += text;
    if (bufferRef.current.includes('>') && resolveRef.current) {
      const full = bufferRef.current; bufferRef.current = '';
      resolveRef.current(full); resolveRef.current = null;
    }
  }

  async function sendCmd(cmd, ms = 4000) {
    if (!charWriteRef.current) throw new Error('Not connected');
    bufferRef.current = '';
    log('→ ' + cmd);
    await charWriteRef.current.writeValue(new TextEncoder().encode(cmd + '\r'));
    return new Promise((res, rej) => {
      resolveRef.current = res;
      setTimeout(() => { if (resolveRef.current) { resolveRef.current = null; rej(new Error('Timeout: ' + cmd)); } }, ms);
    });
  }

  async function connect() {
    setBtState({ connected: false, status: 'scanning', codes: [], rawLog: [], errorMsg: '' });
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'OBDII' }, { namePrefix: 'OBD' }, { namePrefix: 'ELM' },
          { namePrefix: 'Vlink' }, { namePrefix: 'SCANTOOL' }, { namePrefix: 'CarScan' },
        ],
        optionalServices: ['0000fff0-0000-1000-8000-00805f9b34fb', '0000ffe0-0000-1000-8000-00805f9b34fb'],
      });
      deviceRef.current = device;
      device.addEventListener('gattserverdisconnected', () => setBtState(p => ({ ...p, connected: false, status: 'disconnected' })));
      setBtState(p => ({ ...p, status: 'connecting' }));
      const server = await device.gatt.connect();
      let service;
      try { service = await server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb'); }
      catch { service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb'); }
      const chars = await service.getCharacteristics();
      for (const c of chars) {
        if (c.properties.write || c.properties.writeWithoutResponse) charWriteRef.current = c;
        if (c.properties.notify || c.properties.indicate) charNotifyRef.current = c;
      }
      if (!charNotifyRef.current || !charWriteRef.current) throw new Error('Incompatible device characteristics');
      await charNotifyRef.current.startNotifications();
      charNotifyRef.current.addEventListener('characteristicvaluechanged', onNotify);
      setBtState(p => ({ ...p, connected: true, status: 'initializing' }));
      await sendCmd('ATZ'); await sendCmd('ATE0'); await sendCmd('ATL0'); await sendCmd('ATSP0');
      setBtState(p => ({ ...p, status: 'reading' }));
      const raw = await sendCmd('03');
      const codes = parseDTCs(raw);
      setBtState(p => ({ ...p, codes, status: codes.length ? 'done' : 'no_codes' }));
    } catch (err) {
      setBtState(p => ({ ...p, connected: false, status: 'error', errorMsg: err.message }));
    }
  }

  async function disconnect() {
    if (deviceRef.current?.gatt?.connected) deviceRef.current.gatt.disconnect();
    setBtState(p => ({ ...p, connected: false, status: 'idle' }));
  }

  return { btState, connect, disconnect };
}

// ─── Export / Share ───────────────────────────────────────────────────────────
function exportPDF(diagnosis, vehicle) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const vStr = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'N/A';
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rebel Auto Agent Report</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0d0a1a;color:#f0eeff;margin:0;padding:24px;max-width:600px;margin:0 auto}.logo{font-size:20px;font-weight:900;color:#fb923c}.date{font-size:12px;color:#666;margin-top:4px;margin-bottom:24px}.code{font-size:32px;font-weight:900;letter-spacing:4px;color:#f0eeff}.desc{font-size:15px;color:#c4b5fd;font-weight:700;margin:4px 0 16px}.section{background:#18122b;border-radius:12px;padding:14px;margin-bottom:12px}.st{font-size:10px;font-weight:700;color:#7c6a9e;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}.sb{font-size:13px;color:#a0a0b8;line-height:1.6}.cost{font-size:22px;font-weight:900;color:#4ade80}.footer{margin-top:28px;padding-top:16px;border-top:1px solid #2a1f4a;font-size:11px;color:#444;text-align:center}</style></head>
<body><div class="logo">⚡ Rebel Auto Agent</div><div class="date">Report · ${date} · ${vStr}</div>
<div class="code">${diagnosis.fault_code||'N/A'}</div><div class="desc">${diagnosis.fault_description||''}</div>
<div class="section"><div class="st">What it means</div><div class="sb">${diagnosis.plain_english_explanation||'N/A'}</div></div>
<div class="section"><div class="st">Estimated Cost</div><div class="cost">$${diagnosis.estimated_cost_low??'?'}–$${diagnosis.estimated_cost_high??'?'}</div></div>
${diagnosis.consequences_if_ignored?`<div class="section" style="border:1px solid rgba(248,113,113,0.3)"><div class="st" style="color:#f87171">⚠️ If ignored</div><div class="sb" style="color:#fca5a5">${diagnosis.consequences_if_ignored}</div></div>`:''}
${diagnosis.recommended_action?`<div class="section" style="border:1px solid rgba(74,222,128,0.25)"><div class="st" style="color:#4ade80">✅ Recommended action</div><div class="sb" style="color:#86efac">${diagnosis.recommended_action}</div></div>`:''}
<div class="footer">Generated by Rebel Auto Agent · rebelauto-diagnostics-ai.com</div></body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `rebel-auto-${diagnosis.fault_code||'report'}.html`;
  a.click(); URL.revokeObjectURL(url);
}

function share(diagnosis, vehicle) {
  const vStr = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'my vehicle';
  const text = `🔧 ${vStr} — Fault Code: ${diagnosis.fault_code}\n${diagnosis.fault_description}\n\nEst. Repair: $${diagnosis.estimated_cost_low}–$${diagnosis.estimated_cost_high}\n\nDiagnosed with Rebel Auto Agent ⚡\nrebelauto-diagnostics-ai.com`;
  if (navigator.share) navigator.share({ title: 'Diagnostic Report', text }).catch(() => {});
  else navigator.clipboard?.writeText(text).then(() => alert('Copied! ✅'));
}

// ─── QuickFeedback ───────────────────────────────────────────────────────────
function QuickFeedback({ onDone, onDismiss }) {
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!rating) return;
    setLoading(true);
    try {
      await callFunction('submitFeedback', 'POST', {
        name: 'Beta User',
        contact: '',
        diagnosis_rating: rating,
        would_use: rating >= 4 ? 'Yes' : rating === 3 ? 'Maybe' : 'No',
        feedback: comment || `Quick rating: ${rating}/5`,
        source: 'post-diagnosis-nudge',
      });
    } catch (e) {}
    setLoading(false);
    onDone();
  }

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#e2d9f3', marginBottom: 10 }}>How was your diagnosis?</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => setRating(n)} style={{ flex: 1, height: 44, borderRadius: 10, border: rating === n ? '2px solid #a855f7' : '1px solid rgba(124,58,237,0.25)', background: rating === n ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.03)', color: rating === n ? '#e9d5ff' : '#7c6a9e', fontWeight: 700, fontSize: 16, cursor: 'pointer', touchAction: 'manipulation' }}>
            {['😞','😕','😐','🙂','😍'][n-1]}
          </button>
        ))}
      </div>
      <textarea
        placeholder="Optional: anything you'd improve?"
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={2}
        style={{ width: '100%', background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 10, padding: '10px 12px', color: '#c4b5fd', fontSize: 13, resize: 'none', boxSizing: 'border-box', marginBottom: 10 }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={submit} disabled={!rating || loading} style={{ flex: 2, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', borderRadius: 10, padding: '10px 0', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: (!rating || loading) ? 0.5 : 1, touchAction: 'manipulation' }}>
          {loading ? '⏳ Sending...' : '✅ Submit'}
        </button>
        <button onClick={onDismiss} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '10px 0', color: '#7c6a9e', fontSize: 13, cursor: 'pointer', touchAction: 'manipulation' }}>Skip</button>
      </div>

      {/* Demo Mode Banner (fixed bottom) */}
      {isDemoMode && (
        <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', borderRadius: 20, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(124,58,237,0.5)', zIndex: 999, maxWidth: 340, width: 'calc(100% - 32px)' }}>
          <span style={{ fontSize: 20 }}>🎙️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Voice Mode Demo — Unlocked</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Mic & readout active. Subscribe to keep access.</div>
          </div>
        </div>
      )}

      {/* Voice Paywall Modal */}
      {showVoicePaywall && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎙️</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#f0eeff', marginBottom: 8 }}>Voice Mode is Pro</div>
              <div style={{ fontSize: 14, color: '#7c6a9e', lineHeight: 1.6 }}>Speak your fault code & hear your diagnosis read aloud. Upgrade to unlock Voice Mode + unlimited diagnostics.</div>
            </div>
            <button onClick={goToUpgrade} style={{ ...S.btnPrimary, marginBottom: 10 }}>⚡ Upgrade — $19.99/mo</button>
            <button onClick={() => setShowVoicePaywall(false)} style={{ ...S.btnGhost, width: '100%' }}>Maybe later</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DiagnosisCard ─────────────────────────────────────────────────────────
function DiagnosisCard({ diagnosis, vehicle }) {
  if (!diagnosis) return null;
  const sev = diagnosis.severity || 'Medium';
  const color = sevColors[sev] || '#fbbf24';
  return (
    <div style={{ background: '#120f22', border: `1.5px solid ${color}40`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 2, color: '#f0eeff' }}>{diagnosis.fault_code}</div>
          <div style={{ fontSize: 13, color: '#9b7fd4', marginTop: 2, lineHeight: 1.4 }}>{diagnosis.fault_description}</div>
        </div>
        <span style={{ background: `${color}20`, color, border: `1px solid ${color}50`, borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>{sev}</span>
      </div>
      <div style={{ background: '#18122b', borderRadius: 12, padding: 14, marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#7c6a9e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>What it means</div>
        <div style={{ fontSize: 14, color: '#c4b5fd', lineHeight: 1.65 }}>{diagnosis.plain_english_explanation}</div>
      </div>
      {diagnosis.consequences_if_ignored && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>⚠️ If ignored</div>
          <div style={{ fontSize: 13, color: '#fca5a5', lineHeight: 1.5 }}>{diagnosis.consequences_if_ignored}</div>
        </div>
      )}
      {diagnosis.recommended_action && (
        <div style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>✅ Recommended action</div>
          <div style={{ fontSize: 13, color: '#86efac', lineHeight: 1.5 }}>{diagnosis.recommended_action}</div>
        </div>
      )}
      <div style={{ background: '#18122b', borderRadius: 10, padding: '12px 14px', marginBottom: 14, display: 'inline-block' }}>
        <div style={{ fontSize: 10, color: '#7c6a9e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Est. Repair Cost</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#4ade80' }}>${diagnosis.estimated_cost_low} – ${diagnosis.estimated_cost_high}</div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => share(diagnosis, vehicle)} style={{ ...S.btnGhost, flex: 1, fontSize: 13 }}>📤 Share</button>
        <button onClick={() => exportPDF(diagnosis, vehicle)} style={{ ...S.btnGhost, flex: 1, fontSize: 13 }}>📄 Export</button>
      </div>

      {/* Demo Mode Banner (fixed bottom) */}
      {isDemoMode && (
        <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', borderRadius: 20, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(124,58,237,0.5)', zIndex: 999, maxWidth: 340, width: 'calc(100% - 32px)' }}>
          <span style={{ fontSize: 20 }}>🎙️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Voice Mode Demo — Unlocked</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Mic & readout active. Subscribe to keep access.</div>
          </div>
        </div>
      )}

      {/* Voice Paywall Modal */}
      {showVoicePaywall && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎙️</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#f0eeff', marginBottom: 8 }}>Voice Mode is Pro</div>
              <div style={{ fontSize: 14, color: '#7c6a9e', lineHeight: 1.6 }}>Speak your fault code & hear your diagnosis read aloud. Upgrade to unlock Voice Mode + unlimited diagnostics.</div>
            </div>
            <button onClick={goToUpgrade} style={{ ...S.btnPrimary, marginBottom: 10 }}>⚡ Upgrade — $19.99/mo</button>
            <button onClick={() => setShowVoicePaywall(false)} style={{ ...S.btnGhost, width: '100%' }}>Maybe later</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bluetooth Mode (Android + Desktop Chrome) ────────────────────────────────
function BluetoothMode({ vehicle, onCodeFound }) {
  const { btState, connect, disconnect } = useBluetoothOBD();
  const statusMeta = {
    idle: { icon: '🔵', color: '#38bdf8', label: 'Ready to scan' },
    scanning: { icon: '🔍', color: '#a855f7', label: 'Searching for device...' },
    connecting: { icon: '🔗', color: '#fbbf24', label: 'Connecting...' },
    initializing: { icon: '⚙️', color: '#fbbf24', label: 'Initializing adapter...' },
    reading: { icon: '📡', color: '#fbbf24', label: 'Reading fault codes...' },
    done: { icon: '✅', color: '#4ade80', label: `Found ${btState.codes.length} code(s)` },
    no_codes: { icon: '✅', color: '#4ade80', label: 'No fault codes — car looks clean!' },
    error: { icon: '❌', color: '#f87171', label: btState.errorMsg || 'Connection failed' },
    disconnected: { icon: '🔌', color: '#f87171', label: 'Disconnected' },
  };
  const meta = statusMeta[btState.status] || statusMeta.idle;
  const busy = ['scanning', 'connecting', 'initializing', 'reading'].includes(btState.status);

  return (
    <div style={S.card}>
      <div style={S.cardPad}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 30 }}>🔵</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Bluetooth Auto Scan</div>
            <div style={{ fontSize: 12, color: '#7c6a9e' }}>ELM327 adapter · Chrome/Edge on Android</div>
          </div>
        </div>
        {/* Status */}
        <div style={{ background: '#120f22', borderRadius: 12, padding: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>{meta.icon}</span>
          <div style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>{meta.label}</div>
        </div>
        {/* Found codes */}
        {btState.codes.length > 0 && (
          <div style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Fault codes found</div>
            {btState.codes.map(code => (
              <button key={code} onClick={() => onCodeFound(code)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 10, padding: '12px 14px', marginBottom: 8, cursor: 'pointer', color: '#f0eeff', touchAction: 'manipulation' }}>
                <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: 2 }}>{code}</span>
                <span style={{ fontSize: 12, color: '#a855f7', fontWeight: 600 }}>Diagnose →</span>
              </button>
            ))}
          </div>
        )}
        {/* Steps */}
        {btState.status === 'idle' && (
          <div style={{ marginBottom: 14 }}>
            {[
              ['1', 'Plug ELM327 adapter into OBD-II port (under dash, driver side)'],
              ['2', 'Turn ignition ON or start engine'],
              ['3', 'Tap Scan Now — select your device from the popup'],
              ['4', 'Codes are read automatically'],
            ].map(([n, t]) => (
              <div key={n} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1e1535', border: '1px solid #2a1f4a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#a855f7', flexShrink: 0, marginTop: 1 }}>{n}</div>
                <div style={{ fontSize: 13, color: '#9b7fd4', lineHeight: 1.5 }}>{t}</div>
              </div>
            ))}
          </div>
        )}
        {/* Affiliate CTA */}
        <div style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#93c5fd' }}>🛒 Need an adapter? (~$15-25)</div>
            <div style={{ fontSize: 11, color: '#4a6fa5' }}>ELM327 Bluetooth — works with this app</div>
          </div>
          <a href="https://www.amazon.com/s?k=elm327+bluetooth+obd2+adapter&tag=rebelauto20-20" target="_blank" rel="noopener noreferrer"
            style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontWeight: 700, fontSize: 11, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Shop Amazon →
          </a>
        </div>
        {!btState.connected
          ? <button onClick={connect} disabled={busy} style={{ ...S.btnBlue, opacity: busy ? 0.6 : 1 }}>{busy ? '⏳ Scanning...' : '🔵 Scan Now'}</button>
          : <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={connect} style={{ ...S.btnBlue, flex: 2 }}>🔄 Scan Again</button>
              <button onClick={disconnect} style={{ ...S.btnGhost, flex: 1 }}>Disconnect</button>
            </div>
        }
      </div>

      {/* Demo Mode Banner (fixed bottom) */}
      {isDemoMode && (
        <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', borderRadius: 20, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(124,58,237,0.5)', zIndex: 999, maxWidth: 340, width: 'calc(100% - 32px)' }}>
          <span style={{ fontSize: 20 }}>🎙️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Voice Mode Demo — Unlocked</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Mic & readout active. Subscribe to keep access.</div>
          </div>
        </div>
      )}

      {/* Voice Paywall Modal */}
      {showVoicePaywall && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎙️</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#f0eeff', marginBottom: 8 }}>Voice Mode is Pro</div>
              <div style={{ fontSize: 14, color: '#7c6a9e', lineHeight: 1.6 }}>Speak your fault code & hear your diagnosis read aloud. Upgrade to unlock Voice Mode + unlimited diagnostics.</div>
            </div>
            <button onClick={goToUpgrade} style={{ ...S.btnPrimary, marginBottom: 10 }}>⚡ Upgrade — $19.99/mo</button>
            <button onClick={() => setShowVoicePaywall(false)} style={{ ...S.btnGhost, width: '100%' }}>Maybe later</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── iOS WiFi OBD Mode ────────────────────────────────────────────────────────
function WiFiOBDMode({ vehicle, onCodesFound }) {
  const [ip, setIp] = useState('192.168.0.10');
  const [port, setPort] = useState('35000');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  async function connectWifi() {
    setLoading(true); setStatus(null);
    try {
      const result = await callFunction('interpretFaultCode', 'POST', {
        mode: 'wifi_obd',
        ip, port, vehicle,
      });
      if (result.ok && result.data?.codes?.length) {
        onCodesFound(result.data.codes[0]);
      } else {
        setStatus({ error: result.data?.error || 'Could not read codes. Make sure the adapter is powered on and your phone is connected to its WiFi network.' });
      }
    } catch (e) { setStatus({ error: e.message }); }
    setLoading(false);
  }

  return (
    <div style={S.card}>
      <div style={S.cardPad}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 30 }}>📶</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>WiFi OBD Scan</div>
            <div style={{ fontSize: 12, color: '#7c6a9e' }}>ELM327 WiFi adapter · Works on iPhone & Android</div>
          </div>
          <button onClick={() => setShowGuide(g => !g)} style={{ background: showGuide ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 20, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15, color: '#c4b5fd', flexShrink: 0 }}>?</button>
        </div>

        {/* ── Setup Guide (expandable) ── */}
        {showGuide && (
          <div style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#c4b5fd', marginBottom: 12 }}>📖 WiFi OBD2 Setup Guide</div>
            {[
              { icon: '🔌', title: 'Plug in the adapter', desc: 'Insert your WiFi ELM327 adapter into the OBD-II port. It's located under the dashboard on the driver's side. The adapter LED should light up.' },
              { icon: '🔑', title: 'Turn the car on', desc: 'Turn your ignition to the ON position or start the engine. The adapter needs power from the car to broadcast its WiFi signal.' },
              { icon: '📶', title: 'Connect to adapter WiFi', desc: 'Go to your phone's Settings → WiFi. Look for a network named "WiFi_OBDII", "ELM327", or similar. Default password is usually 12345678.' },
              { icon: '📱', title: 'Come back to this page', desc: 'After connecting to the adapter's WiFi, return to the app. You won't have regular internet while connected — that's normal.' },
              { icon: '⚡', title: 'Tap Connect & Read Codes', desc: 'The app connects to the adapter at 192.168.0.10:35000, reads your fault codes, and sends them to the AI for diagnosis automatically.' },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < 4 ? 12 : 0, paddingBottom: i < 4 ? 12 : 0, borderBottom: i < 4 ? '1px solid rgba(124,58,237,0.15)' : 'none' }}>
                <div style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{step.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e2d9f3', marginBottom: 3 }}>{step.title}</div>
                  <div style={{ fontSize: 12, color: '#8b6eae', lineHeight: 1.6 }}>{step.desc}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 12, background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 10, padding: '8px 12px' }}>
              <div style={{ fontSize: 12, color: '#fb923c', fontWeight: 700, marginBottom: 2 }}>⚠️ Troubleshooting</div>
              <div style={{ fontSize: 12, color: '#9b7fd4', lineHeight: 1.6 }}>
                • <b>No network found?</b> Make sure ignition is ON<br/>
                • <b>Wrong IP?</b> Some adapters use 192.168.1.10 — try changing the IP field below<br/>
                • <b>Won't connect?</b> Disconnect and reconnect to the adapter's WiFi, then retry
              </div>
            </div>
          </div>
        )}

        {/* iOS info banner */}
        <div style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.25)', borderRadius: 12, padding: '10px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fb923c', marginBottom: 4 }}>iPhone users — use this method</div>
          <div style={{ fontSize: 12, color: '#9b7fd4', lineHeight: 1.5 }}>Apple blocks Bluetooth OBD on Safari. WiFi adapters work on all devices. Connect your phone to the adapter's WiFi network first, then tap Connect.</div>
        </div>
        {/* Steps */}
        <div style={{ marginBottom: 14 }}>
          {[
            ['1', 'Plug WiFi ELM327 adapter into OBD-II port'],
            ['2', 'On your phone: Settings → WiFi → connect to adapter's network (e.g. "WiFi_OBDII")'],
            ['3', 'Come back here and tap Connect'],
          ].map(([n, t]) => (
            <div key={n} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1e1535', border: '1px solid #2a1f4a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fb923c', flexShrink: 0, marginTop: 1 }}>{n}</div>
              <div style={{ fontSize: 13, color: '#9b7fd4', lineHeight: 1.5 }}>{t}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 14 }}>
          <div>
            <label style={S.label}>Adapter IP</label>
            <input style={S.input} value={ip} onChange={e => setIp(e.target.value)} placeholder="192.168.0.10" />
          </div>
          <div>
            <label style={S.label}>Port</label>
            <input style={{ ...S.input, width: 80 }} value={port} onChange={e => setPort(e.target.value)} placeholder="35000" />
          </div>
        </div>
        {status?.error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#fca5a5' }}>⚠️ {status.error}</div>
        )}
        {/* Affiliate CTA */}
        <div style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#93c5fd' }}>🛒 Need a WiFi adapter? (~$20-30)</div>
            <div style={{ fontSize: 11, color: '#4a6fa5' }}>ELM327 WiFi — iPhone compatible</div>
          </div>
          <a href="https://www.amazon.com/s?k=elm327+wifi+obd2+adapter+iphone&tag=rebelauto20-20" target="_blank" rel="noopener noreferrer"
            style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontWeight: 700, fontSize: 11, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Shop Amazon →
          </a>
        </div>
        <button onClick={connectWifi} disabled={loading} style={{ ...S.btnBlue, opacity: loading ? 0.6 : 1 }}>
          {loading ? '⏳ Connecting...' : '📶 Connect & Read Codes'}
        </button>
      </div>

      {/* Demo Mode Banner (fixed bottom) */}
      {isDemoMode && (
        <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', borderRadius: 20, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(124,58,237,0.5)', zIndex: 999, maxWidth: 340, width: 'calc(100% - 32px)' }}>
          <span style={{ fontSize: 20 }}>🎙️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Voice Mode Demo — Unlocked</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Mic & readout active. Subscribe to keep access.</div>
          </div>
        </div>
      )}

      {/* Voice Paywall Modal */}
      {showVoicePaywall && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎙️</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#f0eeff', marginBottom: 8 }}>Voice Mode is Pro</div>
              <div style={{ fontSize: 14, color: '#7c6a9e', lineHeight: 1.6 }}>Speak your fault code & hear your diagnosis read aloud. Upgrade to unlock Voice Mode + unlimited diagnostics.</div>
            </div>
            <button onClick={goToUpgrade} style={{ ...S.btnPrimary, marginBottom: 10 }}>⚡ Upgrade — $19.99/mo</button>
            <button onClick={() => setShowVoicePaywall(false)} style={{ ...S.btnGhost, width: '100%' }}>Maybe later</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Symptom Checker ────────────────────────────────────────────────────────
function SymptomMode({ vehicle, onDiagnosis }) {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const EXAMPLES = [
    'Car shakes when I brake at high speed',
    'Engine light on, car hesitates when accelerating',
    'Loud knocking from engine when started cold',
    'Car pulls left when driving straight',
    'AC stops blowing cold after 10 minutes',
    'White smoke from exhaust in the morning',
  ];
  async function analyze() {
    if (!symptoms.trim()) return;
    setLoading(true); setError(null);
    try {
      const result = await callFunction('interpretFaultCode', 'POST', { faultCode: 'SYMPTOM', symptoms, vehicle, mode: 'symptom' });
      if (result.ok && result.data) onDiagnosis({ ...result.data, fault_code: result.data.fault_code || 'SYMPTOM', symptoms });
      else setError(result.data?.error || 'Could not analyze. Try describing differently.');
    } catch (e) { setError(e.message); }
    setLoading(false);
  }
  return (
    <div style={S.card}>
      <div style={S.cardPad}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 30 }}>💬</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Symptom Checker</div>
            <div style={{ fontSize: 12, color: '#7c6a9e' }}>No scanner needed — describe what's wrong</div>
          </div>
        </div>
        <label style={S.label}>What's your car doing?</label>
        <textarea style={{ ...S.input, minHeight: 100, resize: 'vertical', lineHeight: 1.6, marginBottom: 12 }}
          placeholder="e.g. My check engine light came on and the car shakes at idle..."
          value={symptoms} onChange={e => setSymptoms(e.target.value)} />
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7c6a9e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Tap an example</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {EXAMPLES.map(ex => (
              <button key={ex} onClick={() => setSymptoms(ex)}
                style={{ ...S.chip, color: symptoms === ex ? '#c084fc' : '#7c6a9e', borderColor: symptoms === ex ? '#7c3aed' : '#2a1f4a' }}>
                {ex}
              </button>
            ))}
          </div>
        </div>
        {error && <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#fca5a5' }}>⚠️ {error}</div>}
        <button onClick={analyze} disabled={!symptoms.trim() || loading} style={{ ...S.btnPrimary, opacity: (!symptoms.trim() || loading) ? 0.6 : 1 }}>
          {loading ? '🤖 Analyzing...' : '🔍 Analyze My Car'}
        </button>
      </div>

      {/* Demo Mode Banner (fixed bottom) */}
      {isDemoMode && (
        <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', borderRadius: 20, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(124,58,237,0.5)', zIndex: 999, maxWidth: 340, width: 'calc(100% - 32px)' }}>
          <span style={{ fontSize: 20 }}>🎙️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Voice Mode Demo — Unlocked</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Mic & readout active. Subscribe to keep access.</div>
          </div>
        </div>
      )}

      {/* Voice Paywall Modal */}
      {showVoicePaywall && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎙️</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#f0eeff', marginBottom: 8 }}>Voice Mode is Pro</div>
              <div style={{ fontSize: 14, color: '#7c6a9e', lineHeight: 1.6 }}>Speak your fault code & hear your diagnosis read aloud. Upgrade to unlock Voice Mode + unlimited diagnostics.</div>
            </div>
            <button onClick={goToUpgrade} style={{ ...S.btnPrimary, marginBottom: 10 }}>⚡ Upgrade — $19.99/mo</button>
            <button onClick={() => setShowVoicePaywall(false)} style={{ ...S.btnGhost, width: '100%' }}>Maybe later</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Diagnose() {
  const [step, setStep] = useState(1);
  const [diagMode, setDiagMode] = useState(null);
  const [vehicle, setVehicle] = useState({ year: '', make: '', model: '', mileage: '', name: '', location: '' });
  const [faultCode, setFaultCode] = useState('');
  const [diagnosis, setDiagnosis] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [feedbackNudge, setFeedbackNudge] = useState('idle'); // idle | shown | submitted | dismissed
  const [device] = useState(() => detectDevice());
  const [trialInfo, setTrialInfo] = useState({ subscription_status: 'trial', trial_exhausted: false, remaining: 3 });
  const [showVoicePaywall, setShowVoicePaywall] = useState(false);

  const isDemoMode = new URLSearchParams(window.location.search).get('demo') === 'voice';
  const isPro = isDemoMode || trialInfo?.subscription_status === 'active';

  const STEPS = ['Vehicle', 'Method', 'Diagnose', 'Results'];

  useEffect(() => {
    callFunction('checkTrialStatus').then(r => { if (r.ok && r.data?.success) setTrialInfo(r.data); });
  }, []);

  useEffect(() => {
    if (isDemoMode) setStep(3);
  }, [isDemoMode]);

  function handleVoiceUpgrade() { setShowVoicePaywall(true); }

  async function goToUpgrade() {
    const result = await callFunction('createCheckout', 'POST', {});
    if (result.data?.url) window.location.href = result.data.url;
  }

  async function runDiagnostic(code) {
    const c = code || faultCode;
    if (!c.trim()) return;
    setFaultCode(c);
    setStep(4); setIsSending(true); setError(null);
    try {
      const result = await callFunction('interpretFaultCode', 'POST', { faultCode: c, vehicle });
      if (result.ok && result.data) {
        setDiagnosis(result.data);
        setMessages([{ role: 'assistant', content: `I analyzed **${c}** for your ${vehicle.year} ${vehicle.make} ${vehicle.model}. Ask me anything about this issue!` }]);
      } else {
        setError(result.data?.error || 'Could not interpret that code. Try again.');
        setStep(3);
      }
    } catch (e) { setError(e.message); setStep(3); }
    setIsSending(false);
  }

  async function sendChat() {
    if (!chatInput.trim() || isChatting) return;
    const msg = chatInput; setChatInput('');
    setMessages(p => [...p, { role: 'user', content: msg }]);
    setIsChatting(true);
    try {
      const result = await callFunction('interpretFaultCode', 'POST', { faultCode: diagnosis?.fault_code, vehicle, followUp: msg, context: diagnosis });
      setMessages(p => [...p, { role: 'assistant', content: result.data?.reply || 'Sorry, try rephrasing.' }]);
    } catch { }
    setIsChatting(false);
  }

  function reset() { setStep(1); setDiagMode(null); setDiagnosis(null); setFaultCode(''); setError(null); setMessages([]); }

  // Mode options — adjusted per device
  const MODES = [
    ...(device.btSupported ? [{
      id: 'bluetooth', icon: '🔵', title: 'Bluetooth Scan', desc: 'Auto-read codes via ELM327 adapter',
      badge: 'EASIEST', badgeColor: '#4ade80', border: '#38bdf850', bg: 'rgba(56,189,248,0.05)',
    }] : []),
    {
      id: 'wifi', icon: '📶', title: 'WiFi OBD Scan',
      desc: device.isIOS ? 'iPhone-compatible — connect via WiFi adapter' : 'ELM327 WiFi adapter — works on all devices',
      badge: device.isIOS ? 'iPhone ✓' : null, badgeColor: '#fb923c', border: '#fb923c40', bg: 'rgba(251,146,60,0.04)',
    },
    {
      id: 'manual', icon: '🔢', title: 'Enter Code Manually', desc: 'Type the OBD-II code from your scanner',
      badge: null, border: '#2a1f4a', bg: '#18122b',
    },
    {
      id: 'symptom', icon: '💬', title: 'Describe Symptoms', desc: 'No scanner at all — just tell me what\'s wrong',
      badge: 'NO SCANNER', badgeColor: '#f59e0b', border: '#f59e0b40', bg: 'rgba(245,158,11,0.04)',
    },
  ];

  return (
    <div style={S.page}>
      <style>{`* { box-sizing: border-box; } input, textarea, select { font-size: 16px !important; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24, paddingTop: 8 }}>
          <div style={{ fontSize: 26, fontWeight: 900, background: 'linear-gradient(135deg,#fb923c,#f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>⚡ Rebel Auto Agent</div>
          <div style={{ fontSize: 13, color: '#7c6a9e', marginTop: 4 }}>AI-powered car diagnostics</div>
          {device.isIOS && <div style={{ marginTop: 6, display: 'inline-block', background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#fb923c', fontWeight: 600 }}>🍎 iPhone Optimized</div>}
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 24 }}>
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done = step > n; const active = step === n;
            return (
              <React.Fragment key={n}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, margin: '0 auto', border: done ? '2px solid #22c55e' : active ? '2px solid #a855f7' : '2px solid #2a1f4a', background: done ? 'rgba(34,197,94,0.15)' : active ? 'rgba(168,85,247,0.12)' : '#18122b', color: done ? '#22c55e' : active ? '#c084fc' : '#7c6a9e' }}>
                    {done ? '✓' : n}
                  </div>
                  <div style={{ fontSize: 10, color: active ? '#c084fc' : '#444', marginTop: 3 }}>{label}</div>
                </div>
                {i < STEPS.length - 1 && <div style={{ width: 28, height: 1, background: done ? '#22c55e' : '#2a1f4a', margin: '0 4px', marginBottom: 16 }} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#fca5a5' }}>⚠️ {error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18, padding: '0 4px', touchAction: 'manipulation' }}>✕</button>
          </div>
        )}

        {/* ── STEP 1: Vehicle ── */}
        {step === 1 && (
          <div style={S.card}>
            <div style={S.cardPad}>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Tell me about your vehicle</div>
              <div style={{ fontSize: 13, color: '#7c6a9e', marginBottom: 18 }}>I'll calibrate cost estimates and find local shops.</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                {['year', 'make', 'model'].map(f => (
                  <div key={f}>
                    <label style={S.label}>{f}</label>
                    <input style={S.input} placeholder={f === 'year' ? '2021' : f === 'make' ? 'Toyota' : 'Camry'}
                      value={vehicle[f]} onChange={e => setVehicle(p => ({ ...p, [f]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div><label style={S.label}>Mileage</label><input style={S.input} placeholder="58,000" value={vehicle.mileage} onChange={e => setVehicle(p => ({ ...p, mileage: e.target.value }))} /></div>
                <div><label style={S.label}>Name</label><input style={S.input} placeholder="First name" value={vehicle.name} onChange={e => setVehicle(p => ({ ...p, name: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={S.label}>Location (City, State)</label>
                <input style={S.input} placeholder="e.g. Atlanta, GA" value={vehicle.location} onChange={e => setVehicle(p => ({ ...p, location: e.target.value }))} />
              </div>
              <button onClick={() => setStep(2)} style={S.btnPrimary}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Choose Mode ── */}
        {step === 2 && (
          <div style={S.card}>
            <div style={S.cardPad}>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>How do you want to diagnose?</div>
              <div style={{ fontSize: 13, color: '#7c6a9e', marginBottom: 18 }}>Pick the method that works for you.</div>
              {MODES.map(m => (
                <div key={m.id} onClick={() => { setDiagMode(m.id); setStep(3); }}
                  style={{ background: m.bg, border: `1.5px solid ${m.border}`, borderRadius: 14, padding: '16px 18px', cursor: 'pointer', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                  <span style={{ fontSize: 26, flexShrink: 0 }}>{m.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{m.title}</div>
                      {m.badge && <span style={{ background: `${m.badgeColor}20`, color: m.badgeColor, border: `1px solid ${m.badgeColor}40`, borderRadius: 6, padding: '2px 7px', fontSize: 9, fontWeight: 800, letterSpacing: 0.5 }}>{m.badge}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#7c6a9e' }}>{m.desc}</div>
                  </div>
                  <span style={{ fontSize: 18, color: '#444' }}>›</span>
                </div>
              ))}
              <button onClick={() => setStep(1)} style={{ ...S.btnGhost, width: '100%', marginTop: 4 }}>← Back</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Diagnose ── */}
        {step === 3 && diagMode === 'bluetooth' && (
          <div>
            <BluetoothMode vehicle={vehicle} onCodeFound={code => runDiagnostic(code)} />
            <button onClick={() => setStep(2)} style={{ ...S.btnGhost, width: '100%' }}>← Back</button>
          </div>
        )}
        {step === 3 && diagMode === 'wifi' && (
          <div>
            <WiFiOBDMode vehicle={vehicle} onCodesFound={code => runDiagnostic(code)} />
            <button onClick={() => setStep(2)} style={{ ...S.btnGhost, width: '100%', marginTop: 8 }}>← Back</button>
          </div>
        )}
        {step === 3 && diagMode === 'manual' && (
          <div style={S.card}>
            <div style={S.cardPad}>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Enter your fault code</div>
              <div style={{ fontSize: 13, color: '#7c6a9e', marginBottom: 18 }}>From your OBD-II scanner or code reader.</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <input
                  style={{ ...S.input, textAlign: 'center', fontSize: 28, fontWeight: 800, letterSpacing: 6, textTransform: 'uppercase', padding: '18px', flex: 1 }}
                  placeholder="P0300" value={faultCode} maxLength={8}
                  onChange={e => setFaultCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && runDiagnostic()} />
                <VoiceMicButton isPro={isPro} onResult={code => setFaultCode(code)} onUpgrade={handleVoiceUpgrade} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7c6a9e', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick select</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {QUICK_CODES.map(qc => (
                    <button key={qc.code} onClick={() => setFaultCode(qc.code)}
                      style={{ ...S.chip, borderColor: faultCode === qc.code ? qc.color : '#2a1f4a', color: faultCode === qc.code ? qc.color : '#9b7fd4' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: qc.color, display: 'inline-block' }} /> {qc.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(2)} style={{ ...S.btnGhost, flex: 1 }}>← Back</button>
                <button onClick={() => runDiagnostic()} disabled={!faultCode.trim() || isSending}
                  style={{ ...S.btnPrimary, flex: 2, opacity: (!faultCode.trim() || isSending) ? 0.6 : 1 }}>
                  {isSending ? 'Analyzing...' : '⚡ Run Diagnostic'}
                </button>
              </div>
            </div>
          </div>
        )}
        {step === 3 && diagMode === 'symptom' && (
          <div>
            <SymptomMode vehicle={vehicle} onDiagnosis={diag => { setDiagnosis(diag); setStep(4); }} />
            <button onClick={() => setStep(2)} style={{ ...S.btnGhost, width: '100%', marginTop: 8 }}>← Back</button>
          </div>
        )}

        {/* ── STEP 4: Analyzing ── */}
        {step === 4 && isSending && (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ width: 56, height: 56, border: '3px solid #2a1f4a', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: '#c4b5fd', marginBottom: 8 }}>Analyzing {faultCode}...</div>
            <div style={{ fontSize: 13, color: '#7c6a9e' }}>Running AI diagnostics · ~10 seconds</div>
          </div>
        )}

        {/* ── STEP 4: Results ── */}
        {step === 4 && !isSending && diagnosis && (
          <div>
            <DiagnosisCard diagnosis={diagnosis} vehicle={vehicle} />

            {/* ── Voice Readout Bar ── */}
            <div style={{ ...S.card, marginBottom: 14 }}>
              <div style={{ ...S.cardPad, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e2d9f3' }}>
                    🔊 Voice Readout {!isPro && <span style={{ fontSize: 10, background: 'rgba(251,146,60,0.15)', color: '#fb923c', borderRadius: 4, padding: '2px 6px', marginLeft: 4 }}>PRO</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#7c6a9e', marginTop: 3 }}>Hear your full diagnosis read aloud</div>
                </div>
                <VoiceReadoutButton diagnosis={diagnosis} isPro={isPro} onUpgrade={handleVoiceUpgrade} />
              </div>
            </div>

            {/* ── Feedback Nudge ── */}
            {feedbackNudge !== 'dismissed' && feedbackNudge !== 'submitted' && (
              <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(168,85,247,0.08))', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 16, padding: '16px 18px', marginBottom: 14 }}>
                {feedbackNudge === 'idle' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#e2d9f3', marginBottom: 3 }}>⚡ Was this helpful?</div>
                      <div style={{ fontSize: 12, color: '#7c6a9e' }}>Takes 30 seconds — helps us improve the app</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setFeedbackNudge('shown')} style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', borderRadius: 10, padding: '9px 16px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', touchAction: 'manipulation' }}>Give Feedback</button>
                      <button onClick={() => setFeedbackNudge('dismissed')} style={{ background: 'transparent', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, padding: '9px 12px', color: '#7c6a9e', fontSize: 13, cursor: 'pointer', touchAction: 'manipulation' }}>✕</button>
                    </div>
                  </div>
                )}
                {feedbackNudge === 'shown' && (
                  <QuickFeedback onDone={() => setFeedbackNudge('submitted')} onDismiss={() => setFeedbackNudge('dismissed')} />
                )}
              </div>
            )}
            {feedbackNudge === 'submitted' && (
              <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 16, padding: '14px 18px', marginBottom: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>🙏</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#4ade80', marginBottom: 4 }}>Thanks for the feedback!</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>You're helping make this better for everyone.</div>
              </div>
            )}

            {/* Chat */}
            <div style={S.card}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a1f4a', fontSize: 14, fontWeight: 700 }}>🤖 Ask a follow-up</div>
              <div style={{ maxHeight: 260, overflowY: 'auto', padding: 14, WebkitOverflowScrolling: 'touch' }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ marginBottom: 10, display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '82%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5, background: msg.role === 'user' ? 'rgba(124,58,237,0.25)' : '#18122b', border: msg.role === 'user' ? '1px solid rgba(124,58,237,0.4)' : '1px solid #2a1f4a', color: msg.role === 'user' ? '#e9d5ff' : '#c4b5fd' }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isChatting && <div style={{ display: 'flex' }}><div style={{ padding: '10px 14px', borderRadius: 12, background: '#18122b', border: '1px solid #2a1f4a', color: '#7c6a9e', fontSize: 13 }}>⏳ Thinking...</div></div>}
              </div>
              <div style={{ padding: '10px 14px', borderTop: '1px solid #2a1f4a', display: 'flex', gap: 8 }}>
                <input style={{ ...S.input, flex: 1 }} placeholder="Ask about this issue..."
                  value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()} />
                <button onClick={sendChat} disabled={!chatInput.trim() || isChatting}
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', borderRadius: 10, padding: '0 18px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 18, opacity: (!chatInput.trim() || isChatting) ? 0.5 : 1, touchAction: 'manipulation' }}>→</button>
              </div>
            </div>
            <button onClick={reset} style={{ ...S.btnGhost, width: '100%' }}>🔄 New Diagnosis</button>
          </div>
        )}
      </div>

      {/* Demo Mode Banner (fixed bottom) */}
      {isDemoMode && (
        <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', borderRadius: 20, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(124,58,237,0.5)', zIndex: 999, maxWidth: 340, width: 'calc(100% - 32px)' }}>
          <span style={{ fontSize: 20 }}>🎙️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Voice Mode Demo — Unlocked</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Mic & readout active. Subscribe to keep access.</div>
          </div>
        </div>
      )}

      {/* Voice Paywall Modal */}
      {showVoicePaywall && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎙️</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#f0eeff', marginBottom: 8 }}>Voice Mode is Pro</div>
              <div style={{ fontSize: 14, color: '#7c6a9e', lineHeight: 1.6 }}>Speak your fault code & hear your diagnosis read aloud. Upgrade to unlock Voice Mode + unlimited diagnostics.</div>
            </div>
            <button onClick={goToUpgrade} style={{ ...S.btnPrimary, marginBottom: 10 }}>⚡ Upgrade — $19.99/mo</button>
            <button onClick={() => setShowVoicePaywall(false)} style={{ ...S.btnGhost, width: '100%' }}>Maybe later</button>
          </div>
        </div>
      )}
    </div>
  );
}
