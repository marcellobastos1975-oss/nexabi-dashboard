import React, { useState, useEffect } from 'react';
import KPICard from '../components/KPICard';
import LiquidityGauge from '../components/LiquidityGauge';
import DynamicCardRenderer from '../components/DynamicCardRenderer';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Sparkles, TrendingUp, CreditCard } from 'lucide-react';
import { SUPABASE_DEFAULT_URL, SUPABASE_ANON_KEY } from '../config';
import { fetchCompanyMetrics, getCachedCompanyMetrics } from '../services/dashboardDataService';
import { formatarMoedaExata, formatarNumeroInteiro } from '../maskUtils';

export default function PanoramaGeral({ 
  isRealEmptyTenant = false, 
  nomeEmpresa = 'DESTAK PRIME', 
  periodoDesc = 'Mês Atual', 
  clienteSelecionado = 'todas',
  periodoPreset = 'mes_atual',
  unidade = 'Todas',
  dataInicio = null,
  dataFim = null,
  refreshCounter = 0
}) {
  const [widgetsCustomizados, setWidgetsCustomizados] = useState([]);

  const [metricas, setMetricas] = useState(() => {
    const cached = getCachedCompanyMetrics(clienteSelecionado, periodoPreset, unidade, dataInicio, dataFim);
    if (cached) return cached;
    return {
      hasData: true,
      vendaBruta: '0,00',
      vendaLiquida: '0,00',
      qtdVendas: '0,00',
      ticketMedio: 'R$ 0,00',
      clientesCompraram: '0,00',
      vendaBrutaDia: '0,00',
      valorCR: '0,00',
      crVencido: '0,00',
      inadimplencia: '0,00',
      percInadimplencia: '0,00',
      jurosRecebidos: '0,00',
      valorCP: '0,00',
      cpVencido: '0,00',
      aPagarEmAtraso: '0,00',
      valorCRMenosCP: 'R$ 0,00',
      valorEstoque: '0,00',
      contasFinanc: '0,00',
      vlrNegativoContas: '0,00',
      saldoTotalContas: '0,00',
      saldoTotalContasNum: 0,
      liquidezGeral: '0,00',
      liquidezGeralNum: 0,
      margemBruta: '0,00',
      percMargem: '0,00',
      metaVenda: '0,00',
      metaAtingida: '0,00',
      historico12m: [],
      formasPagamento: []
    };
  });

  const [carregando, setCarregando] = useState(() => {
    return !getCachedCompanyMetrics(clienteSelecionado, periodoPreset, unidade, dataInicio, dataFim);
  });

  const carregarWidgetsCustomizados = async () => {
    try {
      const url = `${SUPABASE_DEFAULT_URL}/rest/v1/bi_user_custom_widgets?order=criado_em.desc`;
      const resp = await fetch(url, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (resp.ok) {
        const dados = await resp.json();
        setWidgetsCustomizados(dados || []);
      }
    } catch (err) {
      console.error('Erro ao carregar widgets da IA:', err);
    }
  };

  useEffect(() => {
    carregarWidgetsCustomizados();
    
    // 1. Instant cache render (0ms) se disponível
    const cached = getCachedCompanyMetrics(clienteSelecionado, periodoPreset, unidade, dataInicio, dataFim);
    if (cached) {
      setMetricas(cached);
      setCarregando(false);
    } else {
      setCarregando(true);
    }

    // 2. Fetch fresh from Supabase REST / bi_dashboard_cache
    fetchCompanyMetrics(clienteSelecionado, periodoPreset, unidade, dataInicio, dataFim, refreshCounter > 0)
      .then(data => {
        if (data) setMetricas(data);
      })
      .finally(() => {
        setCarregando(false);
      });
  }, [clienteSelecionado, periodoPreset, unidade, dataInicio, dataFim, refreshCounter]);

  const removerWidget = async (id) => {
    try {
      await fetch(`${SUPABASE_DEFAULT_URL}/rest/v1/bi_user_custom_widgets?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      setWidgetsCustomizados(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      console.error('Erro ao remover widget:', err);
    }
  };

  const vendaBrutaNum = parseFloat((metricas?.vendaBruta || '0').replace(',', '.')) || 0;
  const temDados = Boolean(metricas && (metricas.hasData || vendaBrutaNum > 0));

  const historicoGrafico = (temDados && metricas.historico12m && metricas.historico12m.length > 0)
    ? metricas.historico12m
    : [
      { mes: '2026-01', valor: 0 },
      { mes: '2026-02', valor: 0 },
      { mes: '2026-03', valor: 0 },
      { mes: '2026-04', valor: 0 },
      { mes: '2026-05', valor: 0 },
      { mes: '2026-06', valor: 0 },
      { mes: '2026-07', valor: 0 },
      { mes: '2026-08', valor: 0 },
      { mes: '2026-09', valor: 0 },
    ];

  const listaFormas = (temDados && metricas.formasPagamento && metricas.formasPagamento.length > 0) 
    ? metricas.formasPagamento 
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Indicador de Carregamento da Nuvem para Novos Dispositivos */}
      {carregando && (
        <div style={{
          background: 'rgba(0, 210, 255, 0.08)',
          border: '1px solid rgba(0, 210, 255, 0.25)',
          color: '#67e8f9',
          padding: '10px 16px',
          borderRadius: 10,
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <span style={{ fontSize: '14px' }}>⚡</span>
          <span>Sincronizando indicadores analíticos em tempo real com a nuvem...</span>
        </div>
      )}

      {/* Alerta de Resposta de Rede */}
      {metricas?.isNetworkError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#fca5a5',
          padding: '12px 18px',
          borderRadius: 12,
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <div>
              <strong>Tempo de Resposta Excedido:</strong> A nuvem demorou mais que o esperado para consolidar os indicadores.
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              background: 'rgba(0, 210, 255, 0.2)',
              border: '1px solid #00d2ff',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            Atualizar
          </button>
        </div>
      )}

      {/* 1. Grade Superior: Grandes Números da Empresa */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <KPICard 
          label="Venda Bruta" 
          value={carregando && metricas.vendaBruta === '0,00' ? '...' : (temDados ? metricas.vendaBruta : "0,00")} 
          exactValue={temDados ? formatarMoedaExata(metricas.vendaBrutaRaw) : "R$ 0,00"} 
          suffix={carregando && metricas.vendaBruta === '0,00' ? '' : " Mi"} 
          highlight={temDados && metricas.vendaBruta !== '0,00' ? "cyan" : "default"} 
        />
        <KPICard 
          label="Venda Líquida" 
          value={carregando && metricas.vendaLiquida === '0,00' ? '...' : (temDados ? metricas.vendaLiquida : "0,00")} 
          exactValue={temDados ? formatarMoedaExata(metricas.vendaLiquidaRaw) : "R$ 0,00"} 
          suffix={carregando && metricas.vendaLiquida === '0,00' ? '' : " Mi"} 
          highlight={temDados && metricas.vendaLiquida !== '0,00' ? "green" : "default"} 
        />
        <KPICard 
          label="Valor Estoque" 
          value={carregando && metricas.valorEstoque === '0,00' ? '...' : (temDados && metricas.valorEstoque !== '0,00' ? metricas.valorEstoque : "0,00")} 
          exactValue={temDados && metricas.valorEstoqueRaw ? formatarMoedaExata(metricas.valorEstoqueRaw) : "R$ 0,00"} 
          suffix={carregando && metricas.valorEstoque === '0,00' ? '' : " Mi"} 
          highlight={temDados && metricas.valorEstoque !== '0,00' ? "purple" : "default"} 
        />
        <KPICard 
          label="Valor CR" 
          value={carregando && metricas.valorCR === '0,00' ? '...' : (temDados && metricas.valorCR !== '0,00' ? metricas.valorCR : "0,00")} 
          exactValue={temDados && metricas.valorCRRaw ? formatarMoedaExata(metricas.valorCRRaw) : "R$ 0,00"} 
          suffix={carregando && metricas.valorCR === '0,00' ? '' : " Mi"} 
          highlight={temDados && metricas.valorCR !== '0,00' ? "yellow" : "default"} 
        />
        <KPICard 
          label="Valor CP" 
          value={carregando && metricas.valorCP === '0,00' ? '...' : (temDados && metricas.valorCP !== '0,00' ? metricas.valorCP : "0,00")} 
          exactValue={temDados && metricas.valorCPRaw ? formatarMoedaExata(metricas.valorCPRaw) : "R$ 0,00"} 
          suffix={carregando && metricas.valorCP === '0,00' ? '' : " Mi"} 
          highlight={temDados && metricas.valorCP !== '0,00' ? "blue" : "default"} 
        />
        <KPICard 
          label="Contas Financ." 
          value={carregando && metricas.contasFinanc === '0,00' ? '...' : (temDados && metricas.contasFinanc !== '0,00' ? metricas.contasFinanc : "0,00")} 
          exactValue={temDados && metricas.contasFinancRaw ? formatarMoedaExata(metricas.contasFinancRaw) : "R$ 0,00"} 
          suffix={carregando && metricas.contasFinanc === '0,00' ? '' : " Mi"} 
          highlight={temDados && metricas.contasFinanc !== '0,00' ? "cyan" : "default"} 
        />
        <KPICard 
          label="Margem Bruta" 
          value={carregando && metricas.margemBruta === '0,00' ? '...' : (temDados && metricas.margemBruta !== '0,00' ? metricas.margemBruta : "0,00")} 
          exactValue={temDados && metricas.margemBrutaRaw ? formatarMoedaExata(metricas.margemBrutaRaw) : "R$ 0,00"} 
          suffix={carregando && metricas.margemBruta === '0,00' ? '' : " Mi"} 
          highlight={temDados && metricas.margemBruta !== '0,00' ? "green" : "default"} 
        />
        <KPICard 
          label="Inadimplência" 
          value={carregando && metricas.inadimplencia === '0,00' ? '...' : (temDados && metricas.inadimplencia !== '0,00' ? metricas.inadimplencia : "0,00")} 
          exactValue={temDados && metricas.inadimplenciaRaw ? formatarMoedaExata(metricas.inadimplenciaRaw) : "R$ 0,00"} 
          suffix={carregando && metricas.inadimplencia === '0,00' ? '' : " Mi"} 
          highlight={temDados && metricas.inadimplencia !== '0,00' ? "red" : "default"} 
        />
      </div>

      {/* 2. Grade Intermediária: Indicadores Operacionais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <KPICard 
          label="Qtd. Vendas" 
          value={temDados ? metricas.qtdVendas : "0,00"} 
          exactValue={temDados ? formatarNumeroInteiro(metricas.qtdVendasRaw, 'pedidos') : "0 pedidos"} 
          suffix={temDados ? " Mil" : " Mi"} 
        />
        <KPICard 
          label="Clientes Compraram" 
          value={temDados ? metricas.clientesCompraram : "0,00"} 
          exactValue={temDados ? formatarNumeroInteiro(metricas.clientesCompraramRaw, 'clientes') : "0 clientes"} 
          suffix={temDados ? " Mil" : " Mi"} 
        />
        <KPICard 
          label="Juros Recebidos" 
          value={temDados && metricas.jurosRecebidos !== '0,00' ? metricas.jurosRecebidos : "0,00"} 
          exactValue={temDados && metricas.jurosRecebidosRaw ? formatarMoedaExata(metricas.jurosRecebidosRaw) : "R$ 0,00"} 
          suffix=" Mi" 
          highlight={temDados && metricas.jurosRecebidos !== '0,00' ? "green" : "default"} 
        />
        <KPICard 
          label="A Pagar em Atraso" 
          value={temDados && metricas.aPagarEmAtraso !== '0,00' ? metricas.aPagarEmAtraso : "0,00"} 
          exactValue={temDados && metricas.aPagarEmAtrasoRaw ? formatarMoedaExata(metricas.aPagarEmAtrasoRaw) : "R$ 0,00"} 
          suffix=" Mi" 
          highlight={temDados && metricas.aPagarEmAtraso !== '0,00' ? "red" : "default"} 
        />
        <KPICard 
          label="Vlr Negativo C. Fin" 
          value={temDados && metricas.vlrNegativoContas !== '0,00' ? metricas.vlrNegativoContas : "0,00"} 
          exactValue={temDados && metricas.vlrNegativoContasRaw ? formatarMoedaExata(metricas.vlrNegativoContasRaw) : "R$ 0,00"} 
          suffix=" Mi" 
          highlight={temDados && metricas.vlrNegativoContas !== '0,00' ? "red" : "default"} 
        />
        <KPICard 
          label="% Margem" 
          value={temDados && metricas.percMargem !== '0,00' ? metricas.percMargem : "0,00"} 
          exactValue={temDados && metricas.percMargem !== '0,00' ? `${metricas.percMargem}%` : "0,00%"} 
          suffix="%" 
          highlight={temDados && metricas.percMargem !== '0,00' ? "green" : "default"} 
        />
        <KPICard 
          label="% Inadimplência" 
          value={temDados && metricas.percInadimplencia !== '0,00' ? metricas.percInadimplencia : "0,00"} 
          exactValue={temDados && metricas.percInadimplencia !== '0,00' ? `${metricas.percInadimplencia}%` : "0,00%"} 
          suffix="%" 
          highlight={temDados && metricas.percInadimplencia !== '0,00' ? "red" : "default"} 
        />
      </div>

      {/* 3. Grade de Velocidade e Metas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <KPICard 
          label="Venda do Dia" 
          value={temDados ? metricas.vendaBrutaDia : "0,00"} 
          exactValue={temDados ? formatarMoedaExata(metricas.vendaBrutaDiaRaw) : "R$ 0,00"} 
          suffix=" Mi" 
          highlight={temDados && metricas.vendaBrutaDia !== '0,00' ? "cyan" : "default"} 
        />
        <KPICard 
          label="Ticket Médio" 
          value={temDados ? metricas.ticketMedio : "R$ 0,00"} 
          exactValue={temDados ? (metricas.ticketMedioRaw ? formatarMoedaExata(metricas.ticketMedioRaw) : metricas.ticketMedio) : "R$ 0,00"} 
          suffix="" 
        />
        <KPICard 
          label="Meta da Venda" 
          value={temDados ? metricas.metaVenda : "0,00"} 
          exactValue={temDados ? formatarMoedaExata(metricas.metaVendaRaw) : "R$ 0,00"} 
          suffix=" Mi" 
          highlight={temDados ? "green" : "default"} 
          badge={temDados && metricas.metaAtingida ? `${metricas.metaAtingida}%` : null}
        />
        <KPICard 
          label="Valor CR - CP" 
          value={temDados && metricas.valorCRMenosCP !== 'R$ 0,00' ? metricas.valorCRMenosCP : "R$ 0,00"} 
          exactValue={temDados && metricas.valorCRMenosCPRaw ? formatarMoedaExata(metricas.valorCRMenosCPRaw) : "R$ 0,00"} 
          suffix="" 
          highlight={temDados && metricas.valorCRMenosCP !== 'R$ 0,00' ? "yellow" : "default"} 
        />
        <KPICard 
          label="Itens Estoque Negativo" 
          value={temDados && metricas.estoqueItensNegativos ? metricas.estoqueItensNegativos : "0"} 
          exactValue={temDados && metricas.estoqueItensNegativosRaw ? formatarNumeroInteiro(metricas.estoqueItensNegativosRaw, 'itens') : "0 itens"} 
          suffix={temDados ? " Itens" : ""} 
          highlight={temDados && Number(metricas.estoqueItensNegativos) > 0 ? "red" : "default"} 
        />
      </div>

      {/* 4. Seção Central: Gauges de Liquidez + Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Gauges de Liquidez */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <LiquidityGauge 
            title="Saldo Total das Contas" 
            value={temDados ? (metricas.saldoTotalContasNum || 0) : 0} 
            color="#7928ca" 
            max={50} 
          />
          <LiquidityGauge 
            title="(Est. + CR + Ctas) - CP" 
            value={temDados ? (metricas.liquidezGeralNum || 0) : 0} 
            color="#00d2ff" 
            max={50} 
          />
        </div>

        {/* Gráfico Histórico de Vendas Mensal */}
        <div className="glass-card" style={{ padding: 18, minHeight: 250, flex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color="#00d2ff" />
              <span>Histórico de Vendas Mensal (Milhões R$) — ERP Próton</span>
            </h3>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Ano 2026 Auditado</span>
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historicoGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ background: '#0d1b2a', border: '1px solid #00d2ff', borderRadius: 8, fontSize: 12 }} 
                  formatter={(v) => [`R$ ${v} Mi`, 'Faturamento']}
                />
                <Bar dataKey="valor" fill="#00d2ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Formas de Pagamento */}
        <div className="glass-card" style={{ padding: 18, minHeight: 250, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={16} color="#00d2ff" />
              <span>Formas de Pagamento</span>
            </h3>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{periodoDesc}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {listaFormas.length > 0 ? (
              listaFormas.map(f => (
                <div key={f.forma} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#cbd5e1', fontWeight: 500 }}>{f.forma}</span>
                    <strong style={{ color: '#00d2ff', fontSize: '12px' }}>{f.perc}%</strong>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(f.perc, 100)}%`, height: '100%', background: f.cor || '#00d2ff', borderRadius: 4 }} />
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', padding: '30px 0' }}>
                Nenhuma forma de pagamento registrada no período.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Seção de Cards & Insights Personalizados da IA (Fixados no Painel) */}
      {widgetsCustomizados.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Sparkles size={18} color="#00d2ff" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
              Meus Cards &amp; Insights Personalizados da IA (Fixados no Painel)
            </h3>
            <span style={{ fontSize: '11px', background: 'rgba(0, 210, 255, 0.15)', color: '#00d2ff', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
              {widgetsCustomizados.length} {widgetsCustomizados.length === 1 ? 'card ativo' : 'cards ativos'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
            {widgetsCustomizados.map(widget => (
              <DynamicCardRenderer 
                key={widget.id} 
                widget={widget} 
                onRemover={removerWidget} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
