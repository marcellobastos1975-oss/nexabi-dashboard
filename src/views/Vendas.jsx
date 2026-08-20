import React from 'react';
import KPICard from '../components/KPICard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line 
} from 'recharts';

const formasPagamento = [
  { forma: '15-Crediário', perc: 49.89, cor: '#f59e0b' },
  { forma: '1-Dinheiro', perc: 26.31, cor: '#10b981' },
  { forma: '7-Cartão', perc: 23.61, cor: '#00d2ff' },
  { forma: '20-Pix Mensal', perc: 0.11, cor: '#a855f7' },
  { forma: '3-ChqPre', perc: 0.07, cor: '#ec4899' },
];

const vendedoresData = [
  { nome: 'KESSIA', valor: '8.248.698,24', share: '8,76%' },
  { nome: 'NUBIA SILVA', valor: '7.680.462,00', share: '8,16%' },
  { nome: 'ALINE CRUZ', valor: '7.125.095,74', share: '7,57%' },
  { nome: 'THAYSIANE', valor: '6.194.241,94', share: '6,58%' },
  { nome: 'NADIA', valor: '4.274.473,47', share: '4,54%' },
  { nome: '- INATIVO (DEBORAH)', valor: '4.159.899,32', share: '4,42%' },
];

const gruposData = [
  { grupo: 'MÓVEIS', valor: '44.174.384,67', share: '46,92%' },
  { grupo: 'ELETRO', valor: '40.063.435,31', share: '42,56%' },
  { grupo: 'TELEFONIA', valor: '8.153.133,31', share: '8,66%' },
  { grupo: 'ESPORTE E LAZER', valor: '914.707,02', share: '0,97%' },
  { grupo: 'UTILIDADES PARA O LAR', valor: '626.901,59', share: '0,67%' },
];

export default function Vendas() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Grade de 12 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Venda Bruta" value="94,14" suffix=" Mi" highlight="cyan" />
        <KPICard label="Impostos Diretos" value="22,05" suffix=" Mi" highlight="blue" />
        <KPICard label="% Imp. Diretos" value="23,42" suffix="%" />
        <KPICard label="Venda Líquida" value="74,79" suffix=" Mi" highlight="green" />
        <KPICard label="% Vda Líquida" value="79,44" suffix="%" />
        <KPICard label="Ticket Médio" value="R$ 3.641,82" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Margem Contribuição" value="48,83" suffix=" Mi" highlight="green" />
        <KPICard label="% Margem Contrib." value="51,87" suffix="%" highlight="green" />
        <KPICard label="Meta de Venda" value="7,45" suffix=" Mi" highlight="purple" />
        <KPICard label="% Meta Atingida" value="1264,50" suffix="%" highlight="green" />
        <KPICard label="CMV" value="44,24" suffix=" Mi" highlight="yellow" />
        <KPICard label="% CMV s/ Venda" value="53,01" suffix="%" />
      </div>

      {/* Seção Gráficos & Formas de Pagamento */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Ranking Forma de Pagamento */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            💳 Ranking — Formas de Pagamento
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {formasPagamento.map(fp => (
              <div key={fp.forma} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span>{fp.forma}</span>
                  <span style={{ fontWeight: 700, color: fp.cor }}>{fp.perc}%</span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                  <div style={{ width: `${fp.perc}%`, height: '100%', background: fp.cor, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabelas de Vendedores e Grupos */}
        <div className="glass-card" style={{ padding: 16, overflowX: 'auto' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 10 }}>
            👥 Vendas por Vendedor
          </h3>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '6px 4px' }}>Vendedor</th>
                <th style={{ padding: '6px 4px', textAlign: 'right' }}>Valor (R$)</th>
                <th style={{ padding: '6px 4px', textAlign: 'right' }}>% Share</th>
              </tr>
            </thead>
            <tbody>
              {vendedoresData.map(v => (
                <tr key={v.nome} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '6px 4px' }}>{v.nome}</td>
                  <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 600 }}>R$ {v.valor}</td>
                  <td style={{ padding: '6px 4px', textAlign: 'right', color: '#00d2ff' }}>{v.share}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
