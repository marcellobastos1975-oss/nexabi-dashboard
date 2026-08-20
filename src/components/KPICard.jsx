import React from 'react';

export default function KPICard({ label, value, subtext, highlight = 'default', badge = null, prefix = '', suffix = '' }) {
  const getHighlightColor = () => {
    switch (highlight) {
      case 'red':
      case 'alert':
        return '#ef4444';
      case 'green':
      case 'success':
        return '#10b981';
      case 'yellow':
      case 'warning':
        return '#f59e0b';
      case 'cyan':
        return '#00d2ff';
      case 'blue':
        return '#3b82f6';
      case 'purple':
        return '#a855f7';
      default:
        return '#f8fafc';
    }
  };

  return (
    <div className="glass-card" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
        {badge && (
          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.08)', color: 'var(--text-main)', fontWeight: 600 }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: getHighlightColor(), lineHeight: 1.2 }}>
        {prefix}{value}{suffix}
      </div>
      {subtext && (
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 4 }}>
          {subtext}
        </span>
      )}
    </div>
  );
}
