import React from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, 
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { Pin, Trash2, TrendingUp, DollarSign, Award, Layers, Sparkles, CheckCircle2 } from 'lucide-react';

const CORES_PALETA = ['#00d2ff', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function DynamicCardRenderer({ widget, onFixar, onRemover, isFixado = false }) {
  if (!widget) return null;

  const { titulo, tipo_widget, config_json, id } = widget;
  const cfg = config_json || {};
  const dados = Array.isArray(cfg.dados) ? cfg.dados : [];

  const formatarMoeda = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatarNumero = (val) => {
    return new Intl.NumberFormat('pt-BR').format(val || 0);
  };

  // Valor máximo para a barra proporcional de ranking
  const maxValor = dados.length > 0 
    ? Math.max(...dados.map(d => Number(d.valor) || 0), 1) 
    : 1;

  return (
    <div 
      style={{
        background: 'linear-gradient(145deg, #0b1728 0%, #060d17 100%)',
        border: '1px solid rgba(0, 210, 255, 0.25)',
        borderRadius: '14px',
        padding: '16px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        color: '#f8fafc'
      }}
    >
      {/* Header do Card */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
            border: '1px solid rgba(0, 210, 255, 0.4)',
            borderRadius: '10px',
            padding: '8px',
            color: '#00d2ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <SparkleIcon tipo={tipo_widget} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#f8fafc', lineHeight: 1.3 }}>
              {titulo}
            </h4>
            <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 500 }}>
              {cfg.subtitulo || 'Insight Analítico NexaIA'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onFixar && !isFixado && (
            <button
              onClick={() => onFixar(widget)}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: '1px solid rgba(0, 210, 255, 0.4)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.2s ease'
              }}
              title="Fixar este card no meu painel principal"
            >
              <Pin size={12} />
              Fixar
            </button>
          )}
          {isFixado && (
            <span style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              border: '1px solid #10b981',
              borderRadius: '8px',
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <CheckCircle2 size={11} /> Fixado
            </span>
          )}
          {onRemover && (
            <button
              onClick={() => onRemover(id || widget)}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                borderRadius: '8px',
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Remover card"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo Dinâmico Conforme Tipo de Widget */}
      <div style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        {/* TIPO: KPI (Card Único ou Indicador) */}
        {tipo_widget === 'kpi' && (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {cfg.metrica_label || 'Total Apurado'}
            </div>
            <div style={{ 
              fontSize: '30px', 
              fontWeight: 900, 
              color: '#00d2ff', 
              letterSpacing: '-0.5px',
              marginTop: '4px',
              textShadow: '0 0 20px rgba(0, 210, 255, 0.3)'
            }}>
              {cfg.is_moeda ? formatarMoeda(cfg.valor) : formatarNumero(cfg.valor)}
            </div>
            {cfg.descricao && (
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>
                {cfg.descricao}
              </p>
            )}
            {cfg.variacao && (
              <span style={{
                display: 'inline-block',
                marginTop: '10px',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
                background: cfg.variacao >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: cfg.variacao >= 0 ? '#34d399' : '#f87171',
                border: cfg.variacao >= 0 ? '1px solid #10b981' : '1px solid #ef4444'
              }}>
                {cfg.variacao >= 0 ? `+${cfg.variacao}%` : `${cfg.variacao}%`} vs período anterior
              </span>
            )}
          </div>
        )}

        {/* TIPO: RANKING (Visual Moderno em Linhas com Barra Proporcional) */}
        {tipo_widget === 'ranking' && dados.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dados.slice(0, 6).map((row, idx) => {
              const valorNum = Number(row.valor) || 0;
              const perc = Math.min(Math.max((valorNum / maxValor) * 100, 2), 100);
              
              // Cores das medalhas
              let badgeBg = 'rgba(2, 132, 199, 0.2)';
              let badgeBorder = 'rgba(0, 210, 255, 0.4)';
              let badgeColor = '#00d2ff';
              if (idx === 0) {
                badgeBg = 'rgba(245, 158, 11, 0.2)';
                badgeBorder = 'rgba(245, 158, 11, 0.6)';
                badgeColor = '#fbbf24'; // Ouro
              } else if (idx === 1) {
                badgeBg = 'rgba(148, 163, 184, 0.2)';
                badgeBorder = 'rgba(148, 163, 184, 0.5)';
                badgeColor = '#cbd5e1'; // Prata
              } else if (idx === 2) {
                badgeBg = 'rgba(217, 119, 6, 0.2)';
                badgeBorder = 'rgba(217, 119, 6, 0.5)';
                badgeColor = '#f59e0b'; // Bronze
              }

              return (
                <div 
                  key={idx}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <span style={{
                        background: badgeBg,
                        border: `1px solid ${badgeBorder}`,
                        color: badgeColor,
                        borderRadius: '6px',
                        padding: '2px 7px',
                        fontSize: '11px',
                        fontWeight: 800,
                        minWidth: '26px',
                        textAlign: 'center'
                      }}>
                        {idx + 1}º
                      </span>
                      <span 
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#f1f5f9',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={row.label}
                      >
                        {row.label}
                      </span>
                    </div>

                    <span style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: '#00d2ff',
                      fontFamily: 'monospace',
                      whiteSpace: 'nowrap'
                    }}>
                      {cfg.is_moeda ? formatarMoeda(row.valor) : formatarNumero(row.valor)}
                    </span>
                  </div>

                  {/* Micro Barra de Progresso Relativa */}
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${perc}%`,
                      height: '100%',
                      background: idx === 0 
                        ? 'linear-gradient(90deg, #f59e0b 0%, #00d2ff 100%)' 
                        : 'linear-gradient(90deg, #0284c7 0%, #00d2ff 100%)',
                      borderRadius: '2px'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TIPO: BARRAS */}
        {tipo_widget === 'barras' && dados.length > 0 && (
          <div style={{ width: '100%', height: '190px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dados} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="label" 
                  stroke="#94a3b8" 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v) => cfg.is_moeda ? `R$ ${(v/1000).toFixed(0)}k` : v} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#00d2ff', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value) => [cfg.is_moeda ? formatarMoeda(value) : formatarNumero(value), cfg.metrica_label || 'Valor']}
                />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                  {dados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* TIPO: LINHAS */}
        {tipo_widget === 'linhas' && dados.length > 0 && (
          <div style={{ width: '100%', height: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dados} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tickFormatter={(v) => cfg.is_moeda ? `R$ ${(v/1000).toFixed(0)}k` : v} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#00d2ff', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value) => [cfg.is_moeda ? formatarMoeda(value) : formatarNumero(value), cfg.metrica_label || 'Evolução']}
                />
                <Line type="monotone" dataKey="valor" stroke="#00d2ff" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* TIPO: PIZZA */}
        {tipo_widget === 'pizza' && dados.length > 0 && (
          <div style={{ width: '100%', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dados} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="valor">
                  {dados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#00d2ff', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value) => [cfg.is_moeda ? formatarMoeda(value) : formatarNumero(value), 'Participação']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Box Executivo do Parecer NexaIA */}
      {cfg.explicacao_ia && (
        <div style={{
          background: 'rgba(0, 210, 255, 0.05)',
          border: '1px solid rgba(0, 210, 255, 0.25)',
          borderLeft: '4px solid #00d2ff',
          borderRadius: '0 10px 10px 0',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Sparkles size={12} color="#00d2ff" /> Parecer Executivo NexaIA:
          </span>
          <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', fontWeight: 500 }}>
            {cfg.explicacao_ia}
          </p>
        </div>
      )}
    </div>
  );
}

function SparkleIcon({ tipo }) {
  if (tipo === 'kpi') return <DollarSign size={16} />;
  if (tipo === 'ranking') return <Award size={16} />;
  if (tipo === 'linhas') return <TrendingUp size={16} />;
  return <Layers size={16} />;
}
