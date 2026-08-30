import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

const KPI_DESCRICOES = {
  'venda bruta': {
    titulo: 'Venda Bruta',
    significado: 'Faturamento total emitido em pedidos e notas fiscais antes de qualquer dedução comercial.',
    calculo: 'Soma de todos os pedidos faturados (dbauser.tped_pedido_venda + tped_historico_venda).'
  },
  'venda líquida': {
    titulo: 'Venda Líquida',
    significado: 'Receita líquida real da empresa após abatimento de descontos comerciais concedidos e cancelamentos.',
    calculo: 'Venda Bruta menos Descontos e Devoluções.'
  },
  'valor cr': {
    titulo: 'Valor CR (Contas a Receber)',
    significado: 'Volume total de créditos a receber de clientes em aberto na carteira da empresa.',
    calculo: 'Soma de todos os títulos em aberto no Próton (dbauser.trec_aberto).'
  },
  'valor cp': {
    titulo: 'Valor CP (Contas a Pagar)',
    significado: 'Total de compromissos financeiros e duplicatas pendentes de liquidação com fornecedores.',
    calculo: 'Soma dos títulos a pagar em aberto no Próton (dbauser.tpag_aberto).'
  },
  'valor estoque': {
    titulo: 'Valor de Estoque',
    significado: 'Patrimônio financeiro imobilizado em mercadorias disponíveis nos depósitos e filiais.',
    calculo: 'Soma de (Quantidade Física × Custo Médio Unitário) na tabela dbauser.tmer_estoque.'
  },
  'contas financ.': {
    titulo: 'Contas Financeiras & Tesouraria',
    significado: 'Disponibilidade de liquidez imediata em contas correntes, caixas físicos e investimentos.',
    calculo: 'Soma dos saldos ativos conciliados da tesouraria.'
  },
  'margem bruta': {
    titulo: 'Margem Bruta (Lucro Operacional)',
    significado: 'Ganho financeiro bruto obtido após descontar o custo das mercadorias vendidas (CMV).',
    calculo: 'Venda Líquida menos Custo da Mercadoria Vendida (CMV).'
  },
  '% margem': {
    titulo: '% Margem de Contribuição',
    significado: 'Rentabilidade percentual da operação comercial sobre o faturamento líquido.',
    calculo: '(Margem Bruta ÷ Venda Líquida) × 100.'
  },
  'inadimplência': {
    titulo: 'Valor em Inadimplência',
    significado: 'Montante financeiro de títulos vencidos e não pagos pelos clientes na data estipulada.',
    calculo: 'Soma dos títulos em trec_aberto com data de vencimento anterior a hoje.'
  },
  '% inadimplência': {
    titulo: '% Taxa de Inadimplência',
    significado: 'Índice de perda e atraso sobre o volume total da carteira a receber.',
    calculo: '(Valor Inadimplente ÷ Total Contas a Receber) × 100.'
  },
  'qtd. vendas': {
    titulo: 'Quantidade de Pedidos de Venda',
    significado: 'Volume total de pedidos faturados e emitidos no período selecionado.',
    calculo: 'Contagem de números únicos de pedidos (tped_numero_pedido_pk).'
  },
  'clientes compraram': {
    titulo: 'Clientes Ativos / Compradores',
    significado: 'Total de clientes distintos (CNPJs/CPFs únicos) que realizaram compras no período.',
    calculo: 'Contagem distinta de clientes (COUNT DISTINCT tped_cliente_fk).'
  },
  'juros recebidos': {
    titulo: 'Juros e Multas Recebidos',
    significado: 'Receitas financeiras adicionais arrecadadas por pagamentos de títulos com atraso.',
    calculo: 'Soma dos juros contabilizados na liquidação de títulos.'
  },
  'a pagar em atraso': {
    titulo: 'Contas a Pagar em Atraso',
    significado: 'Obrigações com fornecedores cujo vencimento já expirou e aguardam liquidação.',
    calculo: 'Soma de títulos em tpag_aberto com vencimento menor que a data atual.'
  },
  'vlr negativo c. fin': {
    titulo: 'Exposição Negativa / Cheque Especial',
    significado: 'Saldos bancários negativos ou limites de crédito tomados junto às instituições financeiras.',
    calculo: 'Soma das contas financeiras com saldo menor que zero.'
  },
  'venda bruta do dia': {
    titulo: 'Venda Bruta do Dia (Últimas 24h)',
    significado: 'Faturamento registrado especificamente na data de hoje.',
    calculo: 'Soma de pedidos emitidos com data igual a SYSDATE.'
  },
  'ticket médio': {
    titulo: 'Ticket Médio por Venda',
    significado: 'Valor médio faturado por pedido comercial emitido.',
    calculo: 'Venda Total ÷ Quantidade de Pedidos Faturados.'
  },
  'valor cr - cp': {
    titulo: 'Liquidez Operacional Líquida (CR - CP)',
    significado: 'Saldo financeiro operacional de curto prazo resultante da diferença entre o que há a receber e o que há a pagar.',
    calculo: 'Total Contas a Receber menos Total Contas a Pagar.'
  },
  'impostos diretos': {
    titulo: 'Impostos Diretos sobre Vendas',
    significado: 'Carga tributária incidente diretamente sobre as notas fiscais (ICMS, PIS, COFINS, ST).',
    calculo: 'Soma dos impostos destacados no faturamento.'
  },
  '% imp. diretos': {
    titulo: '% Carga Tributária Direta',
    significado: 'Representatividade dos impostos diretos sobre a receita bruta faturada.',
    calculo: '(Impostos Diretos ÷ Venda Bruta) × 100.'
  },
  'cmv': {
    titulo: 'CMV (Custo da Mercadoria Vendida)',
    significado: 'Custo de aquisição e reposição dos produtos faturados no período.',
    calculo: 'Soma de (Quantidade Vendida × Custo de Compra) das mercadorias faturadas.'
  },
  '% cmv s/ venda': {
    titulo: '% CMV sobre Vendas',
    significado: 'Percentual do faturamento comprometido diretamente com o custo das mercadorias.',
    calculo: '(CMV ÷ Venda Bruta) × 100.'
  },
  'margem contribuição': {
    titulo: 'Margem de Contribuição',
    significado: 'Sobra financeira após o pagamento dos custos variáveis (mercadorias e impostos) para cobrir despesas fixas e gerar lucro.',
    calculo: 'Venda Líquida menos CMV menos Impostos Variáveis.'
  },
  '% margem contrib.': {
    titulo: '% Margem de Contribuição Líquida',
    significado: 'Percentual da margem de contribuição sobre a venda líquida.',
    calculo: '(Margem de Contribuição ÷ Venda Líquida) × 100.'
  },
  'meta de venda': {
    titulo: 'Meta Comercial Orçada',
    significado: 'Objetivo de faturamento estipulado para a equipe comercial no período.',
    calculo: 'Orçamento cadastrado por filial e vendedor.'
  },
  '% meta atingida': {
    titulo: '% Cumprimento de Meta',
    significado: 'Atingimento percentual do objetivo de faturamento no período.',
    calculo: '(Venda Realizada ÷ Meta) × 100.'
  }
};

export default function KPICard({ 
  label, 
  value, 
  subtext, 
  highlight = 'default', 
  badge = null, 
  prefix = '', 
  suffix = '',
  tooltip = null 
}) {
  const [modalAberto, setModalAberto] = useState(false);
  const [hoverAtivo, setHoverAtivo] = useState(false);

  const getHighlightColor = () => {
    switch (highlight) {
      case 'red':
      case 'alert': return '#ef4444';
      case 'green':
      case 'success': return '#10b981';
      case 'yellow':
      case 'warning': return '#f59e0b';
      case 'cyan': return '#00d2ff';
      case 'blue': return '#3b82f6';
      case 'purple': return '#a855f7';
      default: return '#f8fafc';
    }
  };

  const keyLabel = (label || '').toLowerCase().trim();
  const infoData = KPI_DESCRICOES[keyLabel] || {
    titulo: label,
    significado: tooltip || 'Indicador analítico consolidado do NexaBI.',
    calculo: 'Mapeado dinamicamente via NexaBI SchemaStudio e SyncAgent.'
  };

  return (
    <>
      <div 
        className="glass-card kpi-card-interactive" 
        style={{ 
          padding: '12px 14px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          userSelect: 'none'
        }}
        onClick={() => setModalAberto(true)}
        onMouseEnter={() => setHoverAtivo(true)}
        onMouseLeave={() => setHoverAtivo(false)}
        title="Clique ou toque para ver a explicação e cálculo deste indicador"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {label}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {badge && (
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.08)', color: 'var(--text-main)', fontWeight: 600 }}>
                {badge}
              </span>
            )}
            <Info size={13} color="#00d2ff" style={{ opacity: 0.7 }} />
          </div>
        </div>

        <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-heading)', color: getHighlightColor(), lineHeight: 1.2 }}>
          {prefix}{value}{suffix}
        </div>

        {subtext && (
          <span style={{ fontSize: '11px', color: '#64748b', marginTop: 4 }}>
            {subtext}
          </span>
        )}

        {/* Tooltip Hover Desktop */}
        {hoverAtivo && (
          <div 
            style={{
              position: 'absolute',
              bottom: '105%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(5, 16, 36, 0.96)',
              border: '1px solid rgba(0, 210, 255, 0.5)',
              borderRadius: 8,
              padding: '8px 12px',
              width: 240,
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              zIndex: 999,
              pointerEvents: 'none',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#00d2ff', marginBottom: 2 }}>
              💡 {infoData.titulo}
            </div>
            <div style={{ fontSize: '10px', color: '#e2e8f0', lineHeight: 1.3 }}>
              {infoData.significado}
            </div>
          </div>
        )}
      </div>

      {/* Modal / Bottom Drawer no Mobile ou ao Clicar */}
      {modalAberto && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 16
          }}
          onClick={() => setModalAberto(false)}
        >
          <div 
            style={{
              background: 'linear-gradient(145deg, #0d1b2a 0%, #070d18 100%)',
              border: '1px solid rgba(0, 210, 255, 0.45)',
              borderRadius: 16,
              padding: '20px 24px',
              maxWidth: 440,
              width: '100%',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setModalAberto(false)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: 28,
                height: 28,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ background: 'rgba(0, 210, 255, 0.15)', padding: 8, borderRadius: 10, color: '#00d2ff' }}>
                <Info size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                  {infoData.titulo}
                </h3>
                <span style={{ fontSize: '12px', color: '#00d2ff', fontWeight: 600 }}>
                  Valor Atual: {prefix}{value}{suffix}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📖 O que significa:
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#e2e8f0', lineHeight: 1.4 }}>
                {infoData.significado}
              </p>
            </div>

            <div style={{ background: 'rgba(0, 210, 255, 0.06)', border: '1px solid rgba(0, 210, 255, 0.18)', borderRadius: 10, padding: '10px 14px' }}>
              <h4 style={{ margin: '0 0 3px 0', fontSize: '11px', color: '#38bdf8', textTransform: 'uppercase' }}>
                ⚙️ Como é calculado no ERP Próton:
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: 1.3 }}>
                {infoData.calculo}
              </p>
            </div>

            <button
              onClick={() => setModalAberto(false)}
              className="btn-primary"
              style={{ width: '100%', marginTop: 16, padding: '10px 0', borderRadius: 10, fontSize: '13px', fontWeight: 700 }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
