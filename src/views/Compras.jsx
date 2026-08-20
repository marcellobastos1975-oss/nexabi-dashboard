import React from 'react';
import KPICard from '../components/KPICard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend 
} from 'recharts';

const leadTimeData = [
  { fornecedor: 'ITATIAIA', dias: 113 },
  { fornecedor: 'AVELAN', dias: 90 },
  { fornecedor: 'PHILCO', dias: 30 },
  { fornecedor: 'POSITIVO', dias: 27 },
  { fornecedor: 'FUJIOKA', dias: 21 },
  { fornecedor: 'MULTILASER', dias: 13 },
  { fornecedor: 'SIRI COM', dias: 12 },
  { fornecedor: 'MARTINS', dias: 8 },
];

const comprasFornecedor = [
  { nome: 'SIRI COM E S...', valor: 192.33, share: '16,60%' },
  { nome: 'FUJIOKA ELE...', valor: 122.76, share: '10,59%' },
  { nome: 'FUJIOKA ELETR...', valor: 96.68, share: '8,34%' },
  { nome: 'WHIRLPOOL...', valor: 94.27, share: '8,13%' },
  { nome: 'ITATIAIA MO...', valor: 69.25, share: '5,98%' },
  { nome: 'MAXI VENDA...', valor: 60.30, share: '5,20%' },
];

const comprasAnoComp = [
  { categoria: 'Compras Totais', atual: 1158.94, anterior: 1158.94 }
];

export default function Compras() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 8 KPIs Principais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Valor das Compras" value="1,16" suffix=" Mi" highlight="cyan" />
        <KPICard label="Prazo Médio Compras" value="10" suffix=" DIAS" highlight="blue" />
        <KPICard label="Compras 5 Maiores" value="575,29" suffix=" Mil" highlight="purple" />
        <KPICard label="% 5 Maiores Fornec." value="49,64" suffix="%" />
        <KPICard label="Pedidos Feitos" value="382" />
        <KPICard label="Pedidos Não Entregues" value="36" highlight="yellow" />
        <KPICard label="% Não Entregues" value="9,42" suffix="%" highlight="yellow" />
        <KPICard label="% Compras à Vista" value="1,83" suffix="%" />
      </div>

      {/* Gráficos de Lead Time e Fornecedores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Lead Time */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            ⏱️ Lead Time — Tempo Decorrido (Dias até Entrega)
          </h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={leadTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="fornecedor" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip contentStyle={{ background: '#0e192c', borderColor: 'rgba(0,210,255,0.3)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="dias" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compras por Fornecedor */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            🏭 Valor das Compras por Fornecedor (Mil R$)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {comprasFornecedor.map(f => (
              <div key={f.nome} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-main)' }}>{f.nome}</span>
                <div>
                  <span style={{ fontWeight: 700, color: '#00d2ff', marginRight: 8 }}>R$ {f.valor} Mil</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({f.share})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparativos Fiscais & Anuais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            📊 Compras: Ano Atual vs Ano Anterior
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '20px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 40, height: 120, background: '#ef4444', borderRadius: '6px 6px 0 0', margin: '0 auto' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: 6 }}>Ano Atual</span>
              <strong style={{ fontSize: '13px' }}>1.158,94 Mil</strong>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 40, height: 120, background: '#3b82f6', borderRadius: '6px 6px 0 0', margin: '0 auto' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: 6 }}>Ano Anterior</span>
              <strong style={{ fontSize: '13px' }}>1.158,94 Mil</strong>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            🚚 Compras: Dentro vs Fora do Estado
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 0' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 4 }}>
                <span>Fora do Estado (Interestadual)</span>
                <strong style={{ color: '#ef4444' }}>78,35%</strong>
              </div>
              <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5 }}>
                <div style={{ width: '78.35%', height: '100%', background: '#ef4444', borderRadius: 5 }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 4 }}>
                <span>Dentro do Estado (Interna)</span>
                <strong style={{ color: '#f59e0b' }}>21,65%</strong>
              </div>
              <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5 }}>
                <div style={{ width: '21.65%', height: '100%', background: '#f59e0b', borderRadius: 5 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
