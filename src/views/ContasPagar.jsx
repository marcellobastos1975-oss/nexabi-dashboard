import React from 'react';
import KPICard from '../components/KPICard';
import LiquidityGauge from '../components/LiquidityGauge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const credoresData = [
  { nome: 'RECEITA FEDERAL DO BRASIL', valor: 715.52 },
  { nome: 'SAMSUNG ELETRÔNICA S/A', valor: 691.20 },
  { nome: 'ELETROLUX DO BRASIL S/A', valor: 385.84 },
  { nome: 'MONDIAL ELETRODOMÉSTICOS', valor: 323.07 },
  { nome: 'INDÚSTRIA BARTIRA MÓVEIS', valor: 300.78 },
  { nome: 'RECONFLEX COLCHÕES IND.', valor: 293.31 },
];

const titulosPagarData = [
  { tipo: 'DUPLICATA DE FORNECEDOR', valor: 425300.00, share: '59,04%', cor: '#10b981' },
  { tipo: 'CHEQUE PRÉ-DATADO EMITIDO', valor: 162900.00, share: '22,61%', cor: '#f59e0b' },
  { tipo: 'IMPOSTO FEDERAL / ESTADUAL', valor: 56200.00, share: '7,80%', cor: '#00d2ff' },
  { tipo: 'FRETE E LOGÍSTICA', valor: 34500.00, share: '4,79%', cor: '#3b82f6' },
  { tipo: 'FOLHA DE PAGAMENTO / RH', valor: 24500.00, share: '3,40%', cor: '#a855f7' },
  { tipo: 'DESPESAS OPERACIONAIS GERAIS', valor: 17000.00, share: '2,36%', cor: '#64748b' },
];

export default function ContasPagar() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 10 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Total à Pagar" value="720,40" suffix=" Mi" highlight="blue" />
        <KPICard label="Total à Pagar Vencido" value="160,38" suffix=" Mil" highlight="red" />
        <KPICard label="Total à Vencer" value="720,24" suffix=" Mi" highlight="green" />
        <KPICard label="Prazo Médio Pagto" value="45" suffix=" Dias" />
        <KPICard label="Valor Pago Período" value="24,50" suffix=" Mi" highlight="cyan" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="A Pagar à Vista" value="1,20" suffix=" Mi" highlight="green" />
        <KPICard label="A Pagar 30 Dias" value="245,33" suffix=" Mi" highlight="blue" />
        <KPICard label="A Pagar 60 Dias" value="280,97" suffix=" Mi" highlight="yellow" />
        <KPICard label="A Pagar 90 Dias" value="192,90" suffix=" Mi" highlight="purple" />
        <KPICard label="% 10 Maiores Fornec." value="53,57" suffix="%" />
      </div>

      {/* Gauges de Inadimplência Fornecedores */}
      <div className="glass-card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
          🛡️ Indicadores de Atraso e Risco de Suprimentos
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <LiquidityGauge title="Inadimplência Geral" value={0.02} color="#10b981" max={20} unit="%" />
          <LiquidityGauge title="Atraso >30 dias" value={0.01} color="#10b981" max={10} unit="%" />
          <LiquidityGauge title="Atraso >60 dias" value={0.01} color="#10b981" max={10} unit="%" />
          <LiquidityGauge title="Atraso >90 dias" value={0.00} color="#10b981" max={10} unit="%" />
        </div>
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Top Credores */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            🏛️ Maiores Credores &amp; Fornecedores a Pagar (Mil R$)
          </h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={credoresData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="nome" stroke="var(--text-muted)" fontSize={9} interval={0} angle={-15} textAnchor="end" height={45} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ background: 'rgba(14, 25, 44, 0.95)', borderColor: 'rgba(0, 210, 255, 0.4)', borderRadius: 8, color: '#ffffff' }} 
                  formatter={(val) => [`R$ ${Number(val).toLocaleString('pt-BR')} Mil`, 'A Pagar']}
                />
                <Bar dataKey="valor" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tipo de Título */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            📑 Obrigações a Pagar por Modalidade
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {titulosPagarData.map(t => (
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
