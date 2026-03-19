import React, { useState } from 'react';

const FUNCTIONS_BASE = 'https://rebel-ai-36e8d1bc.base44.app/functions';

async function createCheckout() {
  try {
    const res = await fetch(`${FUNCTIONS_BASE}/createCheckout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert('Something went wrong. Please try again.');
  } catch {
    alert('Something went wrong. Please try again.');
  }
}

export default function Landing() {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    await createCheckout();
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0714', color: '#f0eeff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid #1a1230' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>⚡</span>
          <span style={{ fontSize: 18, fontWeight: 900, background: 'linear-gradient(135deg,#fb923c,#f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Rebel Auto Agent
          </span>
        </div>
        <button onClick={handleUpgrade} disabled={loading}
          style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', borderRadius: 10, padding: '10px 22px', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Loading...' : 'Get Pro — $9.99/mo'}
        </button>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '80px 24px 60px' }}>
        <div style={{ display: 'inline-block', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 700, color: '#c4b5fd', marginBottom: 24, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          AI-Powered Vehicle Diagnostics
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 900, letterSpacing: -1.5, margin: '0 0 20px', lineHeight: 1.1 }}>
          Know exactly what's{' '}
          <span style={{ background: 'linear-gradient(135deg,#fb923c,#f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            wrong with your car
          </span>
        </h1>
        <p style={{ fontSize: 18, color: '#7c6a9e', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
          Stop paying $150 just to read a check engine light. Rebel Auto Agent decodes any fault code instantly — in plain English — with repair costs and nearby shops.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleUpgrade} disabled={loading}
            style={{ background: 'linear-gradient(135deg,#fb923c,#f87171)', border: 'none', borderRadius: 14, padding: '16px 36px', color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 8px 32px rgba(251,146,60,0.35)', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Loading...' : 'Start Free — 5 Diagnoses Free'}
          </button>
          <a href="https://rebelauto-diagnostics-ai.base44.app" target="_blank" rel="noreferrer"
            style={{ background: 'transparent', border: '1.5px solid #2a1f4a', borderRadius: 14, padding: '16px 36px', color: '#c4b5fd', fontWeight: 700, fontSize: 16, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Open App
          </a>
        </div>
        <p style={{ fontSize: 13, color: '#444', marginTop: 16 }}>No credit card required to start • Cancel anytime</p>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 48, padding: '32px 24px', borderTop: '1px solid #1a1230', borderBottom: '1px solid #1a1230', flexWrap: 'wrap' }}>
        {[
          { num: '5,000+', label: 'Fault Codes Covered' },
          { num: '$150', label: 'Avg. Dealer Diagnostic Fee Saved' },
          { num: '< 10s', label: 'Diagnosis Time' },
          { num: '24/7', label: 'Always Available' },
        ].map(({ num, label }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, background: 'linear-gradient(135deg,#fb923c,#f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{num}</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, margin: 0 }}>How it works</h2>
          <p style={{ fontSize: 15, color: '#7c6a9e', marginTop: 10 }}>Three steps, under 60 seconds</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {[
            { step: '01', icon: '🚗', title: 'Enter your vehicle', desc: 'Add your year, make, model and mileage. Or load a saved vehicle in one tap.' },
            { step: '02', icon: '⚡', title: 'Enter the fault code', desc: 'Type the code from your OBD scanner or pick from common codes. Hit diagnose.' },
            { step: '03', icon: '📋', title: 'Get your full report', desc: 'Plain English explanation, repair cost estimate, severity rating, and nearby shops.' },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} style={{ background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 20, padding: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', letterSpacing: '1px', marginBottom: 12 }}>STEP {step}</div>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f0eeff', marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 14, color: '#7c6a9e', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ background: '#0d0b1a', padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, margin: 0 }}>Everything you need</h2>
            <p style={{ fontSize: 15, color: '#7c6a9e', marginTop: 10 }}>One tool. Total clarity.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { icon: '🔍', title: 'Instant Diagnosis', desc: 'GPT-4o powered analysis of any OBD-II fault code in seconds' },
              { icon: '💰', title: 'Repair Cost Estimates', desc: 'Know the real cost range before you walk into a shop' },
              { icon: '📍', title: 'Nearby Shops', desc: 'Find top-rated repair shops near you with live ratings and hours' },
              { icon: '⚠️', title: 'Severity Ratings', desc: 'Know if you can drive or need to pull over immediately' },
              { icon: '🚗', title: 'Multi-Vehicle', desc: 'Manage your whole garage — all vehicles in one place' },
              { icon: '📱', title: 'Always Available', desc: '24/7 access from any device, no app download needed' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 16, padding: 22 }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f0eeff', marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#7c6a9e', lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, margin: 0 }}>Simple pricing</h2>
          <p style={{ fontSize: 15, color: '#7c6a9e', marginTop: 10 }}>Start free. Upgrade when you're ready.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Free */}
          <div style={{ background: '#18122b', border: '1px solid #2a1f4a', borderRadius: 20, padding: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#7c6a9e', marginBottom: 8 }}>Free</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: '#f0eeff', marginBottom: 4 }}>$0</div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>Forever free</div>
            {['5 free diagnoses', 'Full diagnostic reports', 'Cost estimates', 'Severity ratings'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 14, color: '#9b7fd4' }}>
                <span style={{ color: '#4ade80' }}>✓</span>{f}
              </div>
            ))}
          </div>
          {/* Pro */}
          <div style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(168,85,247,0.1))', border: '1px solid rgba(168,85,247,0.5)', borderRadius: 20, padding: 28, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 16, right: 16, background: 'linear-gradient(135deg,#fb923c,#f87171)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#fff' }}>POPULAR</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#c4b5fd', marginBottom: 8 }}>Pro</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: '#f0eeff', marginBottom: 4 }}>$9.99</div>
            <div style={{ fontSize: 13, color: '#7c6a9e', marginBottom: 24 }}>per month</div>
            {['Unlimited diagnoses', 'Nearby shop finder', 'Full diagnostic reports', 'Cost estimates', 'Multi-vehicle garage', 'Priority support'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 14, color: '#c4b5fd' }}>
                <span style={{ color: '#4ade80' }}>✓</span>{f}
              </div>
            ))}
            <button onClick={handleUpgrade} disabled={loading}
              style={{ width: '100%', marginTop: 16, background: 'linear-gradient(135deg,#fb923c,#f87171)', border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Loading...' : 'Get Pro Now'}
            </button>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(168,85,247,0.08))', borderTop: '1px solid #1a1230', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 16px' }}>Ready to stop guessing?</h2>
        <p style={{ fontSize: 16, color: '#7c6a9e', marginBottom: 36 }}>5 free diagnoses. No credit card. No BS.</p>
        <button onClick={handleUpgrade} disabled={loading}
          style={{ background: 'linear-gradient(135deg,#fb923c,#f87171)', border: 'none', borderRadius: 14, padding: '18px 48px', color: '#fff', fontWeight: 800, fontSize: 18, cursor: 'pointer', boxShadow: '0 8px 32px rgba(251,146,60,0.35)', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Loading...' : 'Get Started Free'}
        </button>
      </div>

      {/* Footer */}
      <div style={{ padding: '24px 32px', borderTop: '1px solid #1a1230', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚡</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#555' }}>Rebel Auto Agent</span>
        </div>
        <div style={{ fontSize: 13, color: '#444' }}>© 2026 Rebel Auto Agent. All rights reserved.</div>
      </div>

    </div>
  );
}
