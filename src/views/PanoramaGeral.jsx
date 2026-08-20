import React from 'react';
import KPICard from '../components/KPICard';
import LiquidityGauge from '../components/LiquidityGauge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Treemap, Cell 
} from 'recharts';

const historicoVendas12m = [
  { mes: '2025-jul', valor: 1391.91 },
  { mes: '2025-ago', valor: 1445.22 },
  { mes: '2025-set', valor: 1376.07 },
  { mes: '2025-out', valor: 1295.47 },
  { mes: '2025-nov', valor: 1501.05 },
  { mes: '2025-dez', valor: 2312.07 },
  { mes: '2026-jan', valor: 1311.28 },
  { mes: '2026-fev', valor: 1109.78 },
  { mes: '2026-mar', valor: 1251.26 },
  { mes: '2026-abr', valor: 1118.94 },
  { mes: '2026-mai', valor: 1566.68 },
  { mes: '2026-jun', valor: 1680.40 },
];

const treemapData = [
  { name: 'Venda Bruta', size: 94.14, fill: '#10b981' },
  { name: 'Valor CR', size: 17.37, fill: '#f59e0b' },
  { name: 'Vr Estoque', size: 7.26, fill: '#3b82f6' },
  { name: 'Valor CP', size: 6.77, fill: '#ef4444' },
  { name: 'Vr Contas', size: 6.26, fill: '#00d2ff' }
];

export default function PanoramaGeral() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Grade Superior de 14 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <KPICard label="Venda Bruta" value="94,14" suffix=" Mi" highlight="cyan" />
        <KPICard label="Valor Estoque" value="7,26" suffix=" Mi" highlight="purple" />
        <KPICard label="Valor CR" value="17,37" suffix=" Mi" highlight="yellow" />
        <KPICard label="Valor CP" value="6,77" suffix=" Mi" highlight="blue" />
        <KPICard label="Contas Financ." value="38,96" suffix=" Mi" highlight="cyan" />
        <KPICard label="Margem Bruta" value="3,96" suffix=" Mi" highlight="green" />
        <KPICard label="Inadimplência" value="9,62" suffix=" Mi" highlight="red" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <KPICard label="Qtd. Vendas" value="122,66" suffix=" Mil" />
        <KPICard label="Clientes Compraram" value="31" suffix=" Mil" />
        <KPICard label="Juros Recebidos" value="2,93" suffix=" Mi" highlight="green" />
        <KPICard label="A Pagar em Atraso" value="160,38" suffix=" Mil" highlight="red" />
        <KPICard label="Vlr Negativo C. Fin" value="-32,70" suffix=" Mi" highlight="red" />
        <KPICard label="% Margem" value="54,61" suffix="%" highlight="green" />
        <KPICard label="% Inadimplência" value="71,39" suffix="%" highlight="red" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <KPICard label="Venda Bruta do Dia" value="17,75" suffix=" Mil" highlight="cyan" />
        <KPICard label="Ticket Médio" value="R$ 3,64" suffix=" Mil" />
        <KPICard label="Valor CR - CP" value="R$ 10,60" suffix=" Mi" highlight="green" />
      </div>

      {/* 2. Seção Central: Gauges de Liquidez + Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <LiquidityGauge title="Saldo Total das Contas" value={6.26} color="#7928ca" max={20} />
          <LiquidityGauge title="(Est. + CR + Ctas) - CP" value={20.26} color="#10b981" max={30} />
        </div>

        {/* Treemap */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>
            Proporção de Capital & Operação (Treemap)
          </h3>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer>
              <Treemap
                data={treemapData}
                dataKey="size"
                stroke="rgba(255,255,255,0.2)"
                fill="#10b981"
              >
                {treemapData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Treemap>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Gráfico Histórico 12 Meses */}
      <div className="glass-card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
          📈 Vendas nos Últimos 12 Meses (Mil R$)
        </h3>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={historicoVendas12m} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
              <YAxis dataKey="mes" type="category" stroke="var(--text-muted)" fontSize={11} width={80} />
              <Tooltip 
                contentStyle={{ background: '#0e192c', borderColor: 'rgba(0,210,255,0.3)', borderRadius: 8 }}
                formatter={(val) => [`R$ ${val.toLocaleString('pt-BR')} Mil`, 'Faturamento']}
              />
              <Bar dataKey="valor" fill="#00d2ff" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
