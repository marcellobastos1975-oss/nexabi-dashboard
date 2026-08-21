import React from 'react';
import KPICard from '../components/KPICard';
import LiquidityGauge from '../components/LiquidityGauge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const credoresData = [
  { nome: 'RECEITA FEDERAL', valor: 715.52 },
  { nome: 'SANDRA & SANTOS', valor: 691.20 },
  { nome: 'JC FABRICA COLCHÕES', valor: 385.84 },
  { nome: 'RECONFLEX', valor: 323.07 },
  { nome: 'GAZIN IND COM', valor: 300.78 },
  { nome: 'SONOBOM COLCHÕES', valor: 293.31 },
];

const titulosPagarData = [
  { tipo: 'DUPLICATA FORNECEDOR', valor: 3753.92, share: '55,41%', cor: '#10b981' },
  { tipo: 'CHEQUE CARTEIRA', valor: 1629.25, share: '24,05%', cor: '#f59e0b' },
  { tipo: 'IMPOSTO FEDERAL', valor: 362.29, share: '5,35%', cor: '#10b981' },
  { tipo: 'A CONFIRMAR', valor: 342.01, share: '5,05%', cor: '#3b82f6' },
  { tipo: 'FRETE FORNECEDOR', valor: 245.13, share: '3,62%', cor: '#ef4444' },
  { tipo: 'OUTRAS DESPESAS', valor: 230.08, share: '3,40%', cor: '#f59e0b' },
  { tipo: 'DESPESA RH / FOLHA', valor: 96.12, share: '1,42%', cor: '#a855f7' },
];

export default function ContasPagar() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 10 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Total à Pagar" value="6,77" suffix=" Mi" highlight="blue" />
        <KPICard label="Total à Pagar Vencido" value="160,38" suffix=" Mil" highlight="red" />
        <KPICard label="Total à Vencer" value="2,61" suffix=" Mi" highlight="green" />
        <KPICard label="Prazo Médio Pagto" value="237" suffix=" Dias" />
        <KPICard label="Valor Pago Período" value="166,59" suffix=" Mi" highlight="cyan" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="A Pagar à Vista" value="20,20" suffix=" Mil" highlight="green" />
        <KPICard label="A Pagar 30 Dias" value="799,33" suffix=" Mil" highlight="blue" />
        <KPICard label="A Pagar 60 Dias" value="609,97" suffix=" Mil" highlight="yellow" />
        <KPICard label="A Pagar 90 Dias" value="476,07" suffix=" Mil" highlight="purple" />
        <KPICard label="% 10 Maiores Fornec." value="53,57" suffix="%" />
      </div>

      {/* Gauges de Inadimplência Fornecedores */}
      <div className="glass-card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
          🛡️ Indicadores de Atraso e Risco de Suprimentos
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <LiquidityGauge title="Inadimplência Geral" value={2.37} color="#10b981" max={20} unit="%" />
          <LiquidityGauge title="Atraso >30 dias" value={0.15} color="#10b981" max={10} unit="%" />
          <LiquidityGauge title="Atraso >60 dias" value={0.15} color="#10b981" max={10} unit="%" />
          <LiquidityGauge title="Atraso >90 dias" value={0.14} color="#10b981" max={10} unit="%" />
        </div>
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Top Credores */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            🏛️ TOP 10 de Maiores Credores (Mil R$)
          </h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={credoresData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="nome" stroke="var(--text-muted)" fontSize={9} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ background: 'rgba(14, 25, 44, 0.95)', borderColor: 'rgba(0, 210, 255, 0.4)', borderRadius: 8, color: '#ffffff', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} 
                  itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 600 }}
                  labelStyle={{ color: '#00d2ff', fontWeight: 700 }}
                  formatter={(val) => [`R$ ${Number(val).toLocaleString('pt-BR')} Mil`, 'A Pagar']}
                />
                <Bar dataKey="valor" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tipo de Título */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            📑 Obrigações por Tipo de Título
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {titulosPagarData.map(t => (
              <div key={t.tipo} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span>{t.tipo}</span>
                  <strong>R$ {t.valor.toLocaleString('pt-BR')} Mil ({t.share})</strong>
                </div>
                <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                  <div style={{ width: t.share, height: '100%', background: t.cor, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
