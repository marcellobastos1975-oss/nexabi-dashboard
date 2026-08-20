import React from 'react';
import KPICard from '../components/KPICard';
import LiquidityGauge from '../components/LiquidityGauge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const titulosData = [
  { tipo: 'CARTÃO CRÉDITO', valor: 5268.97, share: '39,12%', cor: '#f59e0b' },
  { tipo: 'CREDIÁRIO PRÓPRIO', valor: 3795.05, share: '28,18%', cor: '#10b981' },
  { tipo: 'SISTEMA ANTERIOR', valor: 2684.59, share: '19,93%', cor: '#f59e0b' },
  { tipo: 'CARTÃO DÉBITO', valor: 1334.86, share: '9,91%', cor: '#3b82f6' },
  { tipo: 'RENEGOCIAÇÃO', valor: 357.92, share: '2,66%', cor: '#a855f7' },
  { tipo: 'FINANCEIRA', valor: 14.69, share: '0,11%', cor: '#00d2ff' },
  { tipo: 'CHEQUE', valor: 10.57, share: '0,08%', cor: '#ec4899' },
];

const topClientes = [
  { cliente: 'Cliente 01', valor: 3633.46, cor: '#ef4444' },
  { cliente: 'Cliente 02', valor: 1463.76, cor: '#10b981' },
  { cliente: 'Cliente 03', valor: 885.57, cor: '#f59e0b' },
  { cliente: 'Cliente 04', valor: 794.97, cor: '#10b981' },
  { cliente: 'Cliente 05', valor: 496.90, cor: '#ef4444' },
];

export default function ContasReceber() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 10 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Total à Receber" value="13,47" suffix=" Mi" highlight="cyan" />
        <KPICard label="Receber Vencido" value="9,62" suffix=" Mi" highlight="red" />
        <KPICard label="Receber à Vencer" value="3,85" suffix=" Mi" highlight="green" />
        <KPICard label="Prazo Médio Rec." value="151,47" suffix=" Dias" />
        <KPICard label="Recebido no Período" value="120,48" suffix=" Mi" highlight="green" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="A Receber à Vista" value="31,51" suffix=" Mil" highlight="green" />
        <KPICard label="A Receber 30 Dias" value="885,96" suffix=" Mil" highlight="blue" />
        <KPICard label="A Receber 60 Dias" value="785,49" suffix=" Mil" highlight="yellow" />
        <KPICard label="A Receber 90 Dias" value="667,09" suffix=" Mil" highlight="purple" />
        <KPICard label="% 10 Maiores Clientes" value="50,13" suffix="%" />
      </div>

      {/* Régua de Inadimplência (4 Gauges) */}
      <div className="glass-card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
          🚨 Régua de Inadimplência por Faixa de Atraso
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <LiquidityGauge title="Inadimplência Geral" value={71.39} color="#ef4444" max={100} unit="%" />
          <LiquidityGauge title="Crítica (>30 dias)" value={66.89} color="#f59e0b" max={100} unit="%" />
          <LiquidityGauge title="Crítica (>60 dias)" value={63.67} color="#3b82f6" max={100} unit="%" />
          <LiquidityGauge title="Crítica (>90 dias)" value={60.81} color="#ef4444" max={100} unit="%" />
        </div>
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Top 10 Clientes */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            👥 TOP 10 de Clientes a Receber (Mil R$)
          </h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={topClientes}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="cliente" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip contentStyle={{ background: '#0e192c', borderColor: 'rgba(0,210,255,0.3)', borderRadius: 8 }} />
                <Bar dataKey="valor" fill="#00d2ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tipo de Título */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            💳 Valor a Receber por Tipo de Título
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {titulosData.map(t => (
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
