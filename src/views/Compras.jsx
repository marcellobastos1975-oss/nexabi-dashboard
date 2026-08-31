import React from 'react';
import KPICard from '../components/KPICard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line 
} from 'recharts';

const leadTimeData = [
  { fornecedor: 'ITATIAIA MÓVEIS', dias: 28 },
  { fornecedor: 'ELETROLUX DO BRASIL', dias: 21 },
  { fornecedor: 'SAMSUNG ELETRÔNICA', dias: 15 },
  { fornecedor: 'PHILCO ELETRÔNICOS', dias: 18 },
  { fornecedor: 'MONDIAL ELETRODOMÉSTICOS', dias: 14 },
  { fornecedor: 'MULTILASER INDUSTRIAL', dias: 10 },
  { fornecedor: 'INDÚSTRIA BARTIRA', dias: 25 },
  { fornecedor: 'RECONFLEX COLCHÕES', dias: 12 },
];

const comprasFornecedor = [
  { nome: 'ELETROLUX DO BRASIL S/A', valor: '385,84', share: '33,29%' },
  { nome: 'SAMSUNG ELETRÔNICA DA AMAZÔNIA', valor: '292,40', share: '25,23%' },
  { nome: 'MONDIAL ELETRODOMÉSTICOS S/A', valor: '184,30', share: '15,90%' },
  { nome: 'ITATIAIA MÓVEIS S/A', valor: '142,80', share: '12,32%' },
  { nome: 'PHILCO ELETRÔNICOS S/A', valor: '89,60', share: '7,73%' },
  { nome: 'RECONFLEX COLCHÕES INDÚSTRIA', valor: '63,99', share: '5,53%' },
];

export default function Compras() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 8 KPIs Principais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Valor das Compras" value="1,16" suffix=" Mi" highlight="cyan" />
        <KPICard label="Prazo Médio Compras" value="18" suffix=" DIAS" highlight="blue" />
        <KPICard label="Compras 5 Maiores" value="1.094,94" suffix=" Mil" highlight="purple" />
        <KPICard label="% 5 Maiores Fornec." value="94,47" suffix="%" />
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
            ⏱️ Lead Time — Tempo Decorrido (Dias até Entrega do Fornecedor)
          </h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={leadTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="fornecedor" stroke="var(--text-muted)" fontSize={9} interval={0} angle={-15} textAnchor="end" height={45} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ background: 'rgba(14, 25, 44, 0.95)', borderColor: 'rgba(0, 210, 255, 0.4)', borderRadius: 8, color: '#ffffff' }} 
                  formatter={(val) => [`${val} Dias`, 'Prazo de Entrega']}
                />
                <Line type="monotone" dataKey="dias" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compras por Fornecedor (Sem Corte de Nomes) */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            🏭 Principais Fornecedores de Compras (Mil R$)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {comprasFornecedor.map(f => (
              <div key={f.nome} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 6 }}>
                <span style={{ color: '#f8fafc', fontWeight: 600, maxWidth: '60%' }}>{f.nome}</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 700, color: '#00d2ff', marginRight: 8 }}>R$ {f.valor} Mil</span>
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>({f.share})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparativos Fiscais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            🚚 Compras: Dentro vs Fora do Estado (Origem Tributária)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '10px 0' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 4 }}>
                <span>Fora do Estado (Interestadual)</span>
                <strong style={{ color: '#38bdf8' }}>78,35%</strong>
              </div>
              <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5 }}>
                <div style={{ width: '78.35%', height: '100%', background: '#38bdf8', borderRadius: 5 }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 4 }}>
                <span>Dentro do Estado (Bahia)</span>
                <strong style={{ color: '#10b981' }}>21,65%</strong>
              </div>
              <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5 }}>
                <div style={{ width: '21.65%', height: '100%', background: '#10b981', borderRadius: 5 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
