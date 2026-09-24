import React, { useState, useEffect } from 'react';
import KPICard from '../components/KPICard';
import DynamicCardRenderer from '../components/DynamicCardRenderer';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Sparkles, Users, Award, TrendingUp, CreditCard } from 'lucide-react';
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
      metaVenda: '0,00',
      metaAtingida: '0,00',
      historico12m: [],
      topVendedores: [],
      topClientes: [],
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

  const listaVendedores = (temDados && metricas.topVendedores && metricas.topVendedores.length > 0) 
    ? metricas.topVendedores 
    : [];

  const listaTopClientes = (temDados && metricas.topClientes && metricas.topClientes.length > 0) 
    ? metricas.topClientes 
    : [];

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
          <span>Sincronizando indicadores de vendas em tempo real com a nuvem...</span>
        </div>
      )}

      {/* Alerta de Empresa Sem Dados Sincronizados */}
      {!carregando && !temDados && !metricas?.isNetworkError && (
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
            <strong>Aguardando Primeira Sincronização:</strong> Nenhum pedido de venda localizado para <strong>{nomeEmpresa}</strong> no banco em nuvem. Abra o <strong>NexaBI-SyncAgent</strong> no servidor/estação do cliente para iniciar a ingestão contínua das vendas do ERP Próton.
          </div>
        </div>
      )}

      {/* Alerta de Tempo Excedido / Instabilidade de Rede */}
      {!carregando && !temDados && metricas?.isNetworkError && (
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
              <strong>Tempo de Resposta Excedido:</strong> A nuvem demorou mais que o esperado para consolidar os indicadores de vendas.
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

      {/* 1. Grade Superior: Grandes Números de Vendas (Cockpit Executivo) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
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
          label="Meta da Venda" 
          value={temDados ? metricas.metaVenda : "0,00"} 
          exactValue={temDados ? formatarMoedaExata(metricas.metaVendaRaw) : "R$ 0,00"} 
          suffix=" Mi" 
          highlight={temDados ? "green" : "default"} 
          badge={temDados && metricas.metaAtingida ? `${metricas.metaAtingida}%` : null}
        />
      </div>

      {/* 2. Seção Central: Gráfico de Histórico de Vendas Mensal + Formas de Pagamento */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Gráfico Histórico de Vendas */}
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

      {/* 3. Seção de Rankings: Vendedores e Clientes que Mais Compram */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        {/* Ranking de Vendedores */}
        <div className="glass-card" style={{ padding: 18, overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={16} color="#38bdf8" />
              <span>🏆 Top Vendedores — Performance</span>
            </h3>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{periodoDesc}</span>
          </div>
          {listaVendedores.length > 0 ? (
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                  <th style={{ padding: '8px 6px', textAlign: 'left' }}>Vendedor</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Venda (R$)</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Part. (%)</th>
                </tr>
              </thead>
              <tbody>
                {listaVendedores.map((v, i) => {
                  const nomeVendedor = v.vendedor || v.nome || `Vendedor ${i + 1}`;
                  const valorNum = parseFloat(String(v.valor || '0').replace(',', '.')) || 0;
                  const valorFormatado = valorNum >= 1000 
                    ? `R$ ${(valorNum / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mi`
                    : `R$ ${valorNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mil`;
                  const shareFormatado = v.share || (vendaBrutaNum > 0 
                    ? `${((valorNum / (vendaBrutaNum * 1000)) * 100).toFixed(1).replace('.', ',')}%` 
                    : '-');

                  return (
                    <tr key={nomeVendedor + i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '8px 6px' }}>
                        <span style={{ color: i < 3 ? '#38bdf8' : '#e2e8f0', fontWeight: i < 3 ? 700 : 400 }}>
                          {i + 1}º {nomeVendedor}
                        </span>
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600, color: '#f8fafc' }}>
                        {valorFormatado}
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', color: '#10b981', fontWeight: 700 }}>
                        {shareFormatado}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', padding: '30px 0' }}>
              Nenhum ranking de vendedores disponível para este período.
            </div>
          )}
        </div>

        {/* Ranking de Clientes que Mais Compram */}
        <div className="glass-card" style={{ padding: 18, overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} color="#00d2ff" />
              <span>👑 Clientes que Mais Compram</span>
            </h3>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{periodoDesc}</span>
          </div>
          {listaTopClientes.length > 0 ? (
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                  <th style={{ padding: '8px 6px', textAlign: 'left' }}>Cliente</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Total Comprado</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Pedidos</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Share (%)</th>
                </tr>
              </thead>
              <tbody>
                {listaTopClientes.map((c, i) => {
                  const nomeCliente = c.cliente || `Cliente ${i + 1}`;
                  const valorNum = typeof c.valorraw === 'number' ? c.valorraw : ((parseFloat(String(c.valormi || '0').replace(',', '.')) || 0) * 1000000);
                  const valorFormatado = valorNum >= 1000000 
                    ? `R$ ${(valorNum / 1000000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mi`
                    : `R$ ${(valorNum / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mil`;
                  const shareFormatado = c.share || (vendaBrutaNum > 0 
                    ? `${((valorNum / (vendaBrutaNum * 1000000)) * 100).toFixed(1).replace('.', ',')}%` 
                    : '-');

                  return (
                    <tr key={nomeCliente + i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '8px 6px' }}>
                        <span style={{ color: i < 3 ? '#00d2ff' : '#e2e8f0', fontWeight: i < 3 ? 700 : 400 }}>
                          {i + 1}º {nomeCliente}
                        </span>
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600, color: '#f8fafc' }}>
                        {valorFormatado}
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', color: '#94a3b8', fontWeight: 500 }}>
                        {c.qtdpedidos || c.qtdPedidos || '-'}
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', color: '#10b981', fontWeight: 700 }}>
                        {shareFormatado}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', padding: '30px 0' }}>
              Nenhum ranking de clientes disponível para este período.
            </div>
          )}
        </div>
      </div>

      {/* 4. Seção de Cards & Insights Personalizados da IA (Fixados no Painel) */}
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
