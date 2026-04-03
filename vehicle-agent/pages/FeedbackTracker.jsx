import React, { useState, useEffect } from 'react';
import { UserFeedback } from '@/api/entities';

export default function FeedbackTracker() {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await UserFeedback.list('-created_date');
      setResponses(data);
    } catch { setResponses([]); }
    setLoading(false);
  }

  async function markReviewed(id) {
    await UserFeedback.update(id, { status: 'Reviewed' });
    load();
  }

  const total = responses.length;
  const wouldPay = responses.filter(r => r.would_pay === 'Yes').length;
  const wouldUse = responses.filter(r => r.would_use === 'Yes').length;
  const avgNav = total ? (responses.reduce((a, r) => a + (r.navigation_rating || 0), 0) / total).toFixed(1) : '—';
  const avgDiag = total ? (responses.reduce((a, r) => a + (r.diagnosis_rating || 0), 0) / total).toFixed(1) : '—';

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>
          <span style={{ background: 'linear-gradient(135deg,#fb923c,#f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Feedback Tracker
          </span>
        </h1>
        <p style={{ fontSize: 13, color: '#666', marginTop: 4 }}>MVP beta responses</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Responses', val: total, color: '#c4b5fd' },
          { label: 'Would Pay', val: `${wouldPay}/${total}`, color: '#4ade80' },
          { label: 'Would Use', val: `${wouldUse}/${total}`, color: '#60a5fa' },
          { label: 'Nav Rating', val: avgNav, color: '#fb923c' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color }}>{val}</div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Responses */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#555', padding: 40 }}>Loading...</div>
      ) : responses.length === 0 ? (
        <div style={{ background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 16, padding: 32, textAlign: 'center', color: '#555', fontSize: 13 }}>
          No feedback yet — share the link and check back
        </div>
      ) : (
        responses.map(r => (
          <div key={r.id} onClick={() => setSelected(selected?.id === r.id ? null : r)}
            style={{ background: '#18122b', border: `1px solid ${r.status === 'New' ? 'rgba(251,146,60,0.4)' : '#2a1f4a'}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f0eeff' }}>{r.name || 'Anonymous'}</div>
                <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{r.contact || ''} · {r.source}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: r.would_pay === 'Yes' ? '#4ade80' : r.would_pay === 'Maybe' ? '#fbbf24' : '#f87171', background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '3px 10px' }}>
                  {r.would_pay === 'Yes' ? '💰 Would Pay' : r.would_pay === 'Maybe' ? '🤔 Maybe Pay' : '❌ No Pay'}
                </span>
                {r.status === 'New' && <span style={{ fontSize: 10, fontWeight: 800, color: '#fb923c', background: 'rgba(251,146,60,0.15)', borderRadius: 20, padding: '3px 8px' }}>NEW</span>}
              </div>
            </div>

            {selected?.id === r.id && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #2a1f4a' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div style={{ background: '#0f0a1f', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: '#555' }}>Navigation</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fb923c' }}>{'★'.repeat(r.navigation_rating || 0)}{'☆'.repeat(5 - (r.navigation_rating || 0))}</div>
                  </div>
                  <div style={{ background: '#0f0a1f', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: '#555' }}>Diagnosis</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fb923c' }}>{'★'.repeat(r.diagnosis_rating || 0)}{'☆'.repeat(5 - (r.diagnosis_rating || 0))}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: r.would_use === 'Yes' ? '#4ade80' : '#888' }}>Would Use: {r.would_use || '—'}</span>
                  <span style={{ color: '#333' }}>·</span>
                  <span style={{ fontSize: 12, color: r.would_pay === 'Yes' ? '#4ade80' : '#888' }}>Would Pay: {r.would_pay || '—'}</span>
                </div>
                {r.feedback && (
                  <div style={{ background: '#0f0a1f', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#c4b5fd', lineHeight: 1.6, marginBottom: 12 }}>
                    "{r.feedback}"
                  </div>
                )}
                {r.status === 'New' && (
                  <button onClick={(e) => { e.stopPropagation(); markReviewed(r.id); }}
                    style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 8, padding: '6px 14px', color: '#4ade80', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Mark Reviewed ✓
                  </button>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
