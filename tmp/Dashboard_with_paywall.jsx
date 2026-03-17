import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import UpcomingService from '@/components/dashboard/UpcomingService';

const FUNCTIONS_BASE = 'https://rebel-ai-36e8d1bc.base44.app/functions';

export default function Dashboard() {
  const [trialInfo, setTrialInfo] = useState(null);
  const [upgrading, setUpgrading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => { try { return await base44.entities.Vehicle.list('-created_date'); } catch { return []; } },
  });
  const { data: sessions = [] } = useQuery({
    queryKey: ['diagnostic-sessions'],
    queryFn: async () => { try { return await base44.entities.DiagnosticSession.list('-created_date', 10); } catch { return []; } },
  });

  const open = sessions.filter(s => s.status === 'active').length;
  const resolved = sessions.filter(s => s.status === 'resolved').length;

  useEffect(() => {
    fetchTrialStatus();
    // Check for upgrade success
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

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

  return (
    <div>
      {/* Success Banner */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ background: 'linear-gradient(135deg,#4ade80,#22c55e)', borderRadius: 12, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🎉</span>
            <span style={{ fontWeight: 700, color: '#052e16' }}>You're now Pro! Unlimited diagnostics unlocked.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trial Banner */}
      {trialInfo && !isPro && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: isExhausted
              ? 'linear-gradient(135deg,rgba(248,113,113,0.15),rgba(239,68,68,0.08))'
              : 'linear-gradient(135deg,rgba(251,146,60,0.15),rgba(251,191,36,0.08))',
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
            {upgrading ? 'Loading...' : '🚀 Upgrade to Pro'}
          </button>
        </motion.div>
      )}

      {/* Pro Badge */}
      {isPro && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ background: 'linear-gradient(135deg,rgba(74,222,128,0.1),rgba(34,197,94,0.05))', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 14, padding: '10px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>✅</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>Pro Plan — Unlimited diagnostics active</span>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5, margin: 0 }}>
          <span style={{ background: 'linear-gradient(135deg,#fb923c,#f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Dashboard
          </span>
        </h1>
        <p style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Overview of your vehicles and diagnostics</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(168,85,247,0.08))', border: '1px solid rgba(168,85,247,0.35)', borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>🔧</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e2d9f3', marginBottom: 2 }}>Welcome to Rebel Auto Agent</div>
          <div style={{ fontSize: 13, color: '#a78bfa', marginBottom: 6, fontStyle: 'italic' }}>An intelligent diagnostic agent that helps you identify, understand, and manage vehicle issues with expert-level automotive insights.</div>
          <div style={{ fontSize: 13, color: '#7c6a9e', lineHeight: 1.6 }}>
            Your AI-powered vehicle companion. Diagnose fault codes instantly, track maintenance history, get repair cost estimates, and find nearby shops — all in one place.
          </div>
        </div>
      </motion.div>

      {/* Stats */}
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

      <UpcomingService />

      {/* Recent diagnostics */}
      <div style={{ background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #2a1f4a' }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Recent Diagnostics</div>
          <Link to="/History" style={{ fontSize: 12, color: '#c084fc', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
        </div>
        {sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: '#666' }}>
            <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.4 }}>📋</div>
            <div style={{ fontSize: 14, color: '#333', marginBottom: 6 }}>No diagnostics yet</div>
            <Link to="/Diagnose" style={{ fontSize: 13, color: '#c084fc', textDecoration: 'none', fontWeight: 600 }}>Start your first diagnosis →</Link>
          </div>
        ) : (
          sessions.slice(0, 5).map(s => {
            const sevColors = { low: '#4ade80', medium: '#fbbf24', high: '#fb923c', critical: '#f87171' };
            return (
              <div key={s.id} style={{ padding: '14px 20px', borderBottom: '1px solid #231849', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f0eeff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                  {s.vehicle_summary && <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{s.vehicle_summary}</div>}
                </div>
                {s.severity && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: sevColors[s.severity] || '#fbbf24', background: `${sevColors[s.severity] || '#fbbf24'}15`, border: `1px solid ${sevColors[s.severity] || '#fbbf24'}40`, borderRadius: 20, padding: '2px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {s.severity.charAt(0).toUpperCase() + s.severity.slice(1)}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Vehicles */}
      <div style={{ background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #2a1f4a' }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Your Vehicles</div>
          <Link to="/Vehicles" style={{ fontSize: 12, color: '#c084fc', textDecoration: 'none', fontWeight: 600 }}>Manage →</Link>
        </div>
        {vehicles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: '#666' }}>
            <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.4 }}>🚗</div>
            <div style={{ fontSize: 14, color: '#333', marginBottom: 6 }}>No vehicles added</div>
            <Link to="/Vehicles" style={{ fontSize: 13, color: '#c084fc', textDecoration: 'none', fontWeight: 600 }}>Add your first vehicle →</Link>
          </div>
        ) : (
          vehicles.slice(0, 5).map(v => (
            <div key={v.id} style={{ padding: '14px 20px', borderBottom: '1px solid #231849', display: 'flex', alignItems: 'center', gap: 14 }}>
              {v.image_url ? (
                <img src={v.image_url} alt={`${v.make} ${v.model}`} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 10, border: '1px solid #2a1f4a', flexShrink: 0 }} />
              ) : (
                <div style={{ fontSize: 26 }}>🚗</div>
              )}
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{v.year} {v.make} {v.model}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{v.mileage ? v.mileage.toLocaleString() + ' mi' : 'No mileage recorded'}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
