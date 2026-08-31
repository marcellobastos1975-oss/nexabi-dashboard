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
  const isTenantVazio = clienteSelecionado && (
    clienteSelecionado.includes('10.237.062') || 
    clienteSelecionado.includes('f7acf52e') || 
    clienteSelecionado === 'arcoverde'
  );

  const [metricas, setMetricas] = useState(() => {
    if (isTenantVazio) {
      return {
        hasData: false,
        vendaBruta: '0,00',
        vendaLiquida: '0,00',
        impostosDiretos: '0,00',
        cmv: '0,00',
        margemContribuicao: '0,00',
        ticketMedio: 'R$ 0,00',
        metaVenda: '0,00',
        metaAtingida: '0,00'
      };
    }
    return {
      hasData: true,
      vendaBruta: '26,74',
      vendaLiquida: '26,74',
      impostosDiretos: '6,26',
      cmv: '12,03',
      margemContribuicao: '14,71',
      ticketMedio: 'R$ 2.219,62',
      metaVenda: '25,00',
      metaAtingida: '106,96'
    };
  });

  useEffect(() => {
    fetchCompanyMetrics(clienteSelecionado, periodoPreset).then(data => {
      if (data) setMetricas(data);
    });
  }, [clienteSelecionado, periodoPreset]);

  const temDados = isTenantVazio ? false : Boolean(metricas && metricas.hasData);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Alerta se não houver dados */}
      {!temDados && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.12)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          color: '#93c5fd',
          padding: '12px 18px',
          borderRadius: 12,
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <span style={{ fontSize: '18px' }}>ℹ️</span>
          <div>
            <strong>Aguardando Sincronização de Vendas:</strong> Nenhum pedido de venda encontrado para esta empresa no banco de dados. Execute o <strong>NexaBI-SyncAgent</strong> para carregar o histórico de vendas do ERP Próton.
          </div>
        </div>
      )}

      {/* Grade de 12 KPIs com Tooltips Interativos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Venda Bruta" value={temDados ? metricas.vendaBruta : "0,00"} suffix=" Mi" highlight={temDados ? "cyan" : "default"} />
        <KPICard label="Impostos Diretos" value={temDados ? metricas.impostosDiretos : "0,00"} suffix=" Mi" highlight={temDados ? "blue" : "default"} />
        <KPICard label="% Imp. Diretos" value={temDados ? "23,42" : "0,00"} suffix="%" />
        <KPICard label="Venda Líquida" value={temDados ? metricas.vendaLiquida : "0,00"} suffix=" Mi" highlight={temDados ? "green" : "default"} />
        <KPICard label="% Vda Líquida" value={temDados ? "100,00" : "0,00"} suffix="%" />
        <KPICard label="Ticket Médio" value={temDados ? metricas.ticketMedio : "R$ 0,00"} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="CMV (Custo)" value={temDados ? metricas.cmv : "0,00"} suffix=" Mi" highlight={temDados ? "yellow" : "default"} />
        <KPICard label="% CMV" value={temDados ? "45,00" : "0,00"} suffix="%" />
        <KPICard label="Margem Contribuição" value={temDados ? metricas.margemContribuicao : "0,00"} suffix=" Mi" highlight={temDados ? "purple" : "default"} />
        <KPICard label="% Margem Contrib." value={temDados ? "55,00" : "0,00"} suffix="%" />
        <KPICard label="Meta da Venda" value={temDados ? metricas.metaVenda : "0,00"} suffix=" Mi" highlight={temDados ? "green" : "default"} />
        <KPICard label="% Meta Atingida" value={temDados ? metricas.metaAtingida : "0,00"} suffix="%" highlight={temDados ? "green" : "default"} />
      </div>

      {/* Gráficos e Detalhes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Formas de Pagamento */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            💳 Formas de Pagamento
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {temDados ? (
              formasPagamento.map(f => (
                <div key={f.forma} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{f.forma}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 80, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${f.perc}%`, height: '100%', background: f.cor, borderRadius: 3 }} />
                    </div>
                    <strong style={{ color: '#fff', minWidth: 45, textAlign: 'right' }}>{f.perc}%</strong>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '20px 0' }}>
                Nenhum pagamento registrado no período.
              </div>
            )}
          </div>
        </div>

        {/* Ranking de Vendedores */}
        <div className="glass-card" style={{ padding: 16, overflowX: 'auto' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 10 }}>
            🏆 Top Vendedores — NexaBI Performance
          </h3>
          {temDados ? (
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '6px 4px', textAlign: 'left' }}>Vendedor</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>Venda (R$)</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>Part. (%)</th>
                </tr>
              </thead>
              <tbody>
                {vendedoresData.map((v, i) => (
                  <tr key={v.nome} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '6px 4px' }}>
                      <span style={{ color: i < 3 ? '#00d2ff' : '#fff', fontWeight: i < 3 ? 700 : 400 }}>
                        {i + 1}º {v.nome}
                      </span>
                    </td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 600 }}>R$ {v.valor}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{v.share}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '20px 0' }}>
              Nenhum ranking de vendas disponível.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
