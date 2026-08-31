import React, { useState, useEffect } from 'react';
import KPICard from '../components/KPICard';
import { fetchCompanyMetrics } from '../services/dashboardDataService';

const formasPagamento = [
  { forma: '15-Crediário Próprio', perc: 49.89, cor: '#f59e0b' },
  { forma: '1-Dinheiro', perc: 26.31, cor: '#10b981' },
  { forma: '7-Cartão de Crédito/Débito', perc: 23.61, cor: '#00d2ff' },
  { forma: '20-Pix Instantâneo', perc: 0.11, cor: '#a855f7' },
  { forma: '3-Cheque Pré-datado', perc: 0.07, cor: '#ec4899' },
];

const vendedoresData = [
  { nome: 'KESSIA', valor: '4.248.698,24', share: '15,89%' },
  { nome: 'NUBIA SILVA', valor: '3.680.462,00', share: '13,76%' },
  { nome: 'ALINE CRUZ', valor: '3.125.095,74', share: '11,68%' },
  { nome: 'THAYSIANE', valor: '2.894.241,94', share: '10,82%' },
  { nome: 'NADIA', valor: '2.274.473,47', share: '8,50%' },
  { nome: 'DEBORAH SANTOS', valor: '1.984.320,10', share: '7,42%' },
  { nome: 'MARCOS VINICIUS', valor: '1.745.210,00', share: '6,53%' },
];

export default function Vendas({ clienteSelecionado = 'todas', periodoPreset = 'mes_atual' }) {
  const [metricas, setMetricas] = useState({
    vendaBruta: '26,74',
    vendaLiquida: '26,74',
    impostosDiretos: '6,26',
    cmv: '12,03',
    margemContribuicao: '14,71',
    ticketMedio: 'R$ 2.219,62',
    metaVenda: '25,00',
    metaAtingida: '106,96'
  });

  useEffect(() => {
    fetchCompanyMetrics(clienteSelecionado, periodoPreset).then(setMetricas);
  }, [clienteSelecionado, periodoPreset]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Grade de 12 KPIs com Tooltips Interativos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Venda Bruta" value={metricas.vendaBruta} suffix=" Mi" highlight="cyan" />
        <KPICard label="Impostos Diretos" value={metricas.impostosDiretos} suffix=" Mi" highlight="blue" />
        <KPICard label="% Imp. Diretos" value="23,42" suffix="%" />
        <KPICard label="Venda Líquida" value={metricas.vendaLiquida} suffix=" Mi" highlight="green" />
        <KPICard label="% Vda Líquida" value="100,00" suffix="%" />
        <KPICard label="Ticket Médio" value={metricas.ticketMedio} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Margem Contribuição" value={metricas.margemContribuicao} suffix=" Mi" highlight="green" />
        <KPICard label="% Margem Contrib." value="55,00" suffix="%" highlight="green" />
        <KPICard label="Meta de Venda" value={metricas.metaVenda} suffix=" Mi" highlight="purple" />
        <KPICard label="% Meta Atingida" value={metricas.metaAtingida} suffix="%" highlight="green" />
        <KPICard label="CMV" value={metricas.cmv} suffix=" Mi" highlight="yellow" />
        <KPICard label="% CMV s/ Venda" value="45,00" suffix="%" />
      </div>

      {/* Seção Gráficos & Formas de Pagamento */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Ranking Forma de Pagamento */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            💳 Ranking — Formas de Pagamento (Próton)
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

        {/* Tabelas de Vendedores */}
        <div className="glass-card" style={{ padding: 16, overflowX: 'auto' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 10 }}>
            👥 Ranking de Vendas por Vendedor (Top Performers)
          </h3>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '6px 4px' }}>Vendedor</th>
                <th style={{ padding: '6px 4px', textAlign: 'right' }}>Valor Faturado (R$)</th>
                <th style={{ padding: '6px 4px', textAlign: 'right' }}>% Share</th>
              </tr>
            </thead>
            <tbody>
              {vendedoresData.map(v => (
                <tr key={v.nome} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '6px 4px', fontWeight: 600, color: '#f8fafc' }}>{v.nome}</td>
                  <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>R$ {v.valor}</td>
                  <td style={{ padding: '6px 4px', textAlign: 'right', color: '#10b981', fontWeight: 700 }}>{v.share}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
