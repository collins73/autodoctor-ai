import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

const FUNCTIONS_BASE = 'https://rebel-ai-36e8d1bc.base44.app/functions';

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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[Dashboard] Caught error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f87171', marginBottom: 8 }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>{this.state.error?.message || 'Unknown error'}</div>
          <button onClick={() => this.setState({ hasError: false, error: null })}
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function DashboardInner() {
  const [trialInfo, setTrialInfo] = useState({ subscription_status: 'trial', trial_exhausted: false, remaining: 5 });
  const [upgrading, setUpgrading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      try { return await base44.entities.Vehicle.list('-created_date'); }
      catch { return []; }
    },
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['diagnostic-reports'],
    queryFn: async () => {
      try { return await base44.entities.DiagnosticReport.filter({}, { sort: '-created_date', limit: 10 }); }
      catch { return []; }
    },
  });

  const open = reports.filter(s => s.status === 'Open').length;
  const resolved = reports.filter(s => s.status === 'Resolved').length;

  useEffect(() => {
    fetchTrialStatus();
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('upgraded') === 'true') {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch {}
  }, []);

  async function fetchTrialStatus() {
    const result = await callFunction('checkTrialStatus');
    if (result.ok && result.data?.success) setTrialInfo(result.data);
  }

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const result = await callFunction('createCheckout', 'POST', {});
      if (result.data?.url) {
        window.location.href = result.data.url;
      } else {
        alert('Checkout failed: ' + (result.data?.error || 'Unknown error'));
      }
    } catch {
      alert('Upgrade failed. Please try again.');
    }
    setUpgrading(false);
  }

  const isPro = trialInfo?.subscription_status === 'active';
  const isExhausted = trialInfo?.trial_exhausted;
  const remaining = trialInfo?.remaining ?? 5;

  return (
    <div>
      {showSuccess && (
        <div style={{ background: 'linear-gradient(135deg,#4ade80,#22c55e)', borderRadius: 12, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🎉</span>
          <span style={{ fontWeight: 700, color: '#052e16' }}>You are now Pro! Unlimited diagnostics unlocked.</span>
        </div>
      )}

      {!isPro && (
        <div style={{
          background: isExhausted ? 'linear-gradient(135deg,rgba(248,113,113,0.15),rgba(239,68,68,0.08))' : 'linear-gradient(135deg,rgba(251,146,60,0.15),rgba(251,191,36,0.08))',
          border: `1px solid ${isExhausted ? 'rgba(248,113,113,0.4)' : 'rgba(251,146,60,0.4)'}`,
          borderRadius: 14, padding: '14px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{isExhausted ? '🔒' : '⚡'}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: isExhausted ? '#fca5a5' : '#fdba74' }}>
                {isExhausted ? 'Free trial ended' : `${remaining} free diagnosis${remaining === 1 ? '' : 'es'} remaining`}
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                {isExhausted ? 'Upgrade to Pro to continue diagnosing' : 'Upgrade to Pro for unlimited access'}
              </div>
            </div>
          </div>
          <button onClick={handleUpgrade} disabled={upgrading}
            style={{ background: 'linear-gradient(135deg,#fb923c,#f87171)', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', opacity: upgrading ? 0.7 : 1 }}>
            {upgrading ? 'Loading...' : 'Upgrade to Pro'}
          </button>
        </div>
      )}

      {isPro && (
        <div style={{ background: 'linear-gradient(135deg,rgba(74,222,128,0.1),rgba(34,197,94,0.05))', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 14, padding: '10px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>✅</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>Pro Plan — Unlimited diagnostics active</span>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5, margin: 0 }}>
          <span style={{ background: 'linear-gradient(135deg,#fb923c,#f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Dashboard
          </span>
        </h1>
        <p style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Overview of your vehicles and diagnostics</p>
      </div>

      <div style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(168,85,247,0.08))', border: '1px solid rgba(168,85,247,0.35)', borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>🔧</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e2d9f3', marginBottom: 2 }}>Welcome to Rebel Auto Agent</div>
          <div style={{ fontSize: 13, color: '#7c6a9e', lineHeight: 1.6 }}>
            Your AI-powered vehicle companion. Diagnose fault codes instantly, track maintenance history, get repair cost estimates, and find nearby shops — all in one place.
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { num: vehicles.length, label: 'Vehicles', color: '#60a5fa' },
          { num: open, label: 'Open Issues', color: '#f87171' },
          { num: resolved, label: 'Resolved', color: '#4ade80' },
        ].map(({ num, label, color }) => (
          <div key={label} style={{ background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, color }}>{num}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <Link to="/Diagnose" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(168,85,247,0.08))', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 16, padding: 18, cursor: 'pointer' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#c4b5fd' }}>New Diagnosis</div>
            <div style={{ fontSize: 12, color: '#7c6a9e', marginTop: 2 }}>Scan a fault code</div>
          </div>
        </Link>
        <Link to="/Vehicles" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(96,165,250,0.1),rgba(59,130,246,0.05))', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 16, padding: 18, cursor: 'pointer' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🚗</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#93c5fd' }}>My Vehicles</div>
            <div style={{ fontSize: 12, color: '#4a6fa5', marginTop: 2 }}>Manage your garage</div>
          </div>
        </Link>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#7c6a9e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recent Reports</div>
        {reports.length === 0 ? (
          <div style={{ background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 16, padding: 24, textAlign: 'center', color: '#555', fontSize: 13 }}>
            No diagnostics yet — run your first scan
          </div>
        ) : (
          reports.slice(0, 5).map(r => (
            <div key={r.id} style={{ background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 14, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f0eeff' }}>{r.fault_code}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{r.fault_description?.slice(0, 50)}{r.fault_description?.length > 50 ? '...' : ''}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: r.severity === 'Critical' ? '#f87171' : r.severity === 'High' ? '#fb923c' : r.severity === 'Medium' ? '#fbbf24' : '#4ade80', background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '3px 10px' }}>
                {r.severity}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ErrorBoundary>
      <DashboardInner />
    </ErrorBoundary>
  );
}
