import React, { useState } from 'react';
import { UserFeedback } from '@/api/entities';

export default function Feedback() {
  const [form, setForm] = useState({
    name: '', contact: '', navigation_rating: 0, diagnosis_rating: 0,
    would_use: '', would_pay: '', feedback: '', source: 'In-App',
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await UserFeedback.create({ ...form, status: 'New' });
      setSubmitted(true);
    } catch (err) {
      alert('Something went wrong. Try again.');
    }
    setSaving(false);
  }

  const stars = (field) => (
    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} onClick={() => set(field, n)}
          style={{ fontSize: 28, cursor: 'pointer', color: form[field] >= n ? '#fb923c' : '#2a1f4a' }}>★</span>
      ))}
    </div>
  );

  if (submitted) return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🙏</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#f0eeff', marginBottom: 8 }}>Thanks for the feedback!</div>
      <div style={{ fontSize: 14, color: '#666' }}>Your input helps make Rebel Auto Agent better.</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>
          <span style={{ background: 'linear-gradient(135deg,#fb923c,#f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Share Your Feedback
          </span>
        </h1>
        <p style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Help us build something you actually love</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Name</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="John Doe"
            style={{ width: '100%', background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 10, padding: '10px 14px', color: '#f0eeff', fontSize: 14, marginTop: 6, boxSizing: 'border-box' }} />
        </div>

        {/* Contact */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email or Phone (optional)</label>
          <input value={form.contact} onChange={e => set('contact', e.target.value)}
            placeholder="so we can follow up"
            style={{ width: '100%', background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 10, padding: '10px 14px', color: '#f0eeff', fontSize: 14, marginTop: 6, boxSizing: 'border-box' }} />
        </div>

        {/* Navigation Rating */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>How easy was it to navigate?</label>
          {stars('navigation_rating')}
        </div>

        {/* Diagnosis Rating */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>How useful was the diagnosis?</label>
          {stars('diagnosis_rating')}
        </div>

        {/* Would Use */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Would you use this regularly?</label>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {['Yes', 'Maybe', 'No'].map(opt => (
              <button type="button" key={opt} onClick={() => set('would_use', opt)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${form.would_use === opt ? '#fb923c' : '#2a1f4a'}`, background: form.would_use === opt ? 'rgba(251,146,60,0.15)' : '#18122b', color: form.would_use === opt ? '#fb923c' : '#666', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Would Pay */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Would you pay for this?</label>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {['Yes', 'Maybe', 'No'].map(opt => (
              <button type="button" key={opt} onClick={() => set('would_pay', opt)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${form.would_pay === opt ? '#4ade80' : '#2a1f4a'}`, background: form.would_pay === opt ? 'rgba(74,222,128,0.1)' : '#18122b', color: form.would_pay === opt ? '#4ade80' : '#666', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Open Feedback */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Anything else? (improvements, bugs, ideas)</label>
          <textarea value={form.feedback} onChange={e => set('feedback', e.target.value)}
            placeholder="Be brutally honest..."
            rows={4}
            style={{ width: '100%', background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 10, padding: '10px 14px', color: '#f0eeff', fontSize: 14, marginTop: 6, boxSizing: 'border-box', resize: 'vertical' }} />
        </div>

        <button type="submit" disabled={saving}
          style={{ width: '100%', background: 'linear-gradient(135deg,#fb923c,#f87171)', border: 'none', borderRadius: 12, padding: '14px 0', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Submitting...' : 'Submit Feedback 🙏'}
        </button>
      </form>
    </div>
  );
}
