import React from 'react';
import KPICard from '../components/KPICard';
import LiquidityGauge from '../components/LiquidityGauge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const titulosData = [
  { tipo: 'CARTÃO DE CRÉDITO', valor: 125740.00, share: '39,12%', cor: '#f59e0b' },
  { tipo: 'CREDIÁRIO PRÓPRIO', valor: 90580.00, share: '28,18%', cor: '#10b981' },
  { tipo: 'BOLETO BANCÁRIO', valor: 64080.00, share: '19,93%', cor: '#00d2ff' },
  { tipo: 'CARTÃO DE DÉBITO', valor: 31860.00, share: '9,91%', cor: '#3b82f6' },
  { tipo: 'RENEGOCIAÇÃO / ACORDO', valor: 8550.00, share: '2,66%', cor: '#a855f7' },
  { tipo: 'FINANCEIRA (CDC)', valor: 520.00, share: '0,16%', cor: '#ec4899' },
  { tipo: 'CHEQUE PRÉ-DATADO', valor: 222.30, share: '0,07%', cor: '#64748b' },
];

const topClientes = [
  { cliente: 'SUPERMERCADO CENTRAL BAHIA', valor: 3633.46, cor: '#00d2ff' },
  { cliente: 'COMERCIAL ALVORADA FEIRA', valor: 1463.76, cor: '#10b981' },
  { cliente: 'DISTRIBUIDORA BAHIA NORTE', valor: 885.57, cor: '#f59e0b' },
  { cliente: 'ATACADÃO SALVADOR PRIME', valor: 794.97, cor: '#38bdf8' },
  { cliente: 'REDE LOJAS UNIÃO', valor: 496.90, cor: '#a855f7' },
];

export default function ContasReceber() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 10 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Total à Receber" value="321,55" suffix=" Mi" highlight="cyan" />
        <KPICard label="Receber Vencido" value="38,58" suffix=" Mi" highlight="red" />
        <KPICard label="Receber à Vencer" value="282,97" suffix=" Mi" highlight="green" />
        <KPICard label="Prazo Médio Rec." value="68" suffix=" Dias" />
        <KPICard label="Recebido no Período" value="26,74" suffix=" Mi" highlight="green" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="A Receber à Vista" value="1,85" suffix=" Mi" highlight="green" />
        <KPICard label="A Receber 30 Dias" value="88,96" suffix=" Mi" highlight="blue" />
        <KPICard label="A Receber 60 Dias" value="78,50" suffix=" Mi" highlight="yellow" />
        <KPICard label="A Receber 90 Dias" value="66,70" suffix=" Mi" highlight="purple" />
        <KPICard label="% 10 Maiores Clientes" value="50,13" suffix="%" />
      </div>

      {/* Régua de Inadimplência (4 Gauges) */}
      <div className="glass-card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
          🚨 Régua de Inadimplência por Faixa de Atraso (ERP Próton)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <LiquidityGauge title="Inadimplência Geral" value={12.00} color="#ef4444" max={100} unit="%" />
          <LiquidityGauge title="Atraso >30 dias" value={8.50} color="#f59e0b" max={100} unit="%" />
          <LiquidityGauge title="Atraso >60 dias" value={5.20} color="#3b82f6" max={100} unit="%" />
          <LiquidityGauge title="Crítica (>90 dias)" value={3.10} color="#ef4444" max={100} unit="%" />
        </div>
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Top 10 Clientes com Nomes Reais */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            👥 Top Clientes com Maior Saldo Devedor (Mil R$)
          </h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={topClientes}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="cliente" stroke="var(--text-muted)" fontSize={9} interval={0} angle={-15} textAnchor="end" height={45} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ background: 'rgba(14, 25, 44, 0.95)', borderColor: 'rgba(0, 210, 255, 0.4)', borderRadius: 8, color: '#ffffff' }} 
                  formatter={(val) => [`R$ ${Number(val).toLocaleString('pt-BR')} Mil`, 'Saldo Devedor']}
                />
                <Bar dataKey="valor" fill="#00d2ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tipo de Título */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            💳 Carteira de Cobrança por Tipo de Título
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {titulosData.map(t => (
              <div key={t.tipo} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>{t.tipo}</span>
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
