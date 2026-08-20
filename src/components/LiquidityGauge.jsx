import React from 'react';

export default function LiquidityGauge({ title, value, color = '#10b981', max = 50, unit = 'Mi' }) {
  const percentage = Math.min(Math.max((value / max) * 100, 10), 95);
  const strokeDash = (percentage / 100) * 188;

  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textAlign: 'center' }}>
        {title}
      </span>
      <div style={{ position: 'relative', width: 140, height: 75, overflow: 'hidden' }}>
        <svg viewBox="0 0 100 50" style={{ width: '100%', height: '100%' }}>
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray="188"
            strokeDashoffset={188 - strokeDash}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#f8fafc', marginTop: -15 }}>
        {value} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{unit}</span>
      </div>
    </div>
  );
}
