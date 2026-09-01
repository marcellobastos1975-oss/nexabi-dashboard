import React, { useState, useEffect } from 'react';
import KPICard from '../components/KPICard';
import { fetchCompanyMetrics } from '../services/dashboardDataService';

export default function Vendas({ 
  clienteSelecionado = 'todas', 
  periodoPreset = 'mes_atual', 
  unidade = 'Todas',
  dataInicio = null,
  dataFim = null 
}) {
  const [metricas, setMetricas] = useState({
    hasData: true,
    vendaBruta: '0,00',
    vendaLiquida: '0,00',
    impostosDiretos: '0,00',
    percImpostosDiretos: '0,00',
    cmv: '0,00',
    percCMV: '0,00',
    margemContribuicao: '0,00',
    percMargemContribuicao: '0,00',
    ticketMedio: 'R$ 0,00',
    metaVenda: '0,00',
    metaAtingida: '0,00',
    topVendedores: [],
    formasPagamento: []
  });

  useEffect(() => {
    fetchCompanyMetrics(clienteSelecionado, periodoPreset, unidade, dataInicio, dataFim).then(data => {
      if (data) setMetricas(data);
    });
  }, [clienteSelecionado, periodoPreset, unidade, dataInicio, dataFim]);

  const temDados = Boolean(metricas && metricas.hasData);
  const listaVendedores = (temDados && metricas.topVendedores && metricas.topVendedores.length > 0) ? metricas.topVendedores : [];
  const listaFormas = (temDados && metricas.formasPagamento && metricas.formasPagamento.length > 0) ? metricas.formasPagamento : [];

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
        <KPICard label="% Imp. Diretos" value={temDados ? metricas.percImpostosDiretos : "0,00"} suffix="%" />
        <KPICard label="Venda Líquida" value={temDados ? metricas.vendaLiquida : "0,00"} suffix=" Mi" highlight={temDados ? "green" : "default"} />
        <KPICard label="% Vda Líquida" value={temDados ? "100,00" : "0,00"} suffix="%" />
        <KPICard label="Ticket Médio" value={temDados ? metricas.ticketMedio : "R$ 0,00"} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="CMV (Custo)" value={temDados ? metricas.cmv : "0,00"} suffix=" Mi" highlight={temDados ? "yellow" : "default"} />
        <KPICard label="% CMV" value={temDados ? metricas.percCMV : "0,00"} suffix="%" />
        <KPICard label="Margem Contribuição" value={temDados ? metricas.margemContribuicao : "0,00"} suffix=" Mi" highlight={temDados ? "purple" : "default"} />
        <KPICard label="% Margem Contrib." value={temDados ? metricas.percMargemContribuicao : "0,00"} suffix="%" />
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
            {listaFormas.length > 0 ? (
              listaFormas.map(f => (
                <div key={f.forma} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{f.forma}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 80, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(f.perc, 100)}%`, height: '100%', background: f.cor || '#00d2ff', borderRadius: 3 }} />
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
          {listaVendedores.length > 0 ? (
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '6px 4px', textAlign: 'left' }}>Vendedor</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>Venda (R$)</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>Part. (%)</th>
                </tr>
              </thead>
              <tbody>
                {listaVendedores.map((v, i) => (
                  <tr key={v.nome || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
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
