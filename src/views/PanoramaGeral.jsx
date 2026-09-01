import React, { useState, useEffect } from 'react';
import KPICard from '../components/KPICard';
import LiquidityGauge from '../components/LiquidityGauge';
import DynamicCardRenderer from '../components/DynamicCardRenderer';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Treemap 
} from 'recharts';
import { Sparkles } from 'lucide-react';
import { SUPABASE_DEFAULT_URL, SUPABASE_ANON_KEY } from '../config';
import { fetchCompanyMetrics } from '../services/dashboardDataService';


export default function PanoramaGeral({ 
  isRealEmptyTenant = false, 
  nomeEmpresa = 'DESTAK PRIME', 
  periodoDesc = 'Mês Atual', 
  clienteSelecionado = 'todas',
  periodoPreset = 'mes_atual',
  unidade = 'Todas',
  dataInicio = null,
  dataFim = null
}) {
  const [widgetsCustomizados, setWidgetsCustomizados] = useState([]);

  const [metricas, setMetricas] = useState({
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
    historico12m: []
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
    fetchCompanyMetrics(clienteSelecionado, periodoPreset, unidade, dataInicio, dataFim).then(data => {
      if (data) setMetricas(data);
    });
  }, [clienteSelecionado, periodoPreset, unidade, dataInicio, dataFim]);

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

  const temDados = Boolean(metricas && metricas.hasData);

  const historicoGrafico = (temDados && metricas.historico12m && metricas.historico12m.length > 0)
    ? metricas.historico12m
    : [
      { mes: '2026-jan', valor: 0 },
      { mes: '2026-fev', valor: 0 },
      { mes: '2026-mar', valor: 0 },
      { mes: '2026-abr', valor: 0 },
      { mes: '2026-mai', valor: 0 },
      { mes: '2026-jun', valor: 0 },
      { mes: '2026-jul', valor: 0 },
      { mes: '2026-ago', valor: 0 },
    ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Alerta de Empresa Sem Dados Sincronizados */}
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
            <strong>Aguardando Primeira Sincronização:</strong> Nenhum dado localizado para <strong>{nomeEmpresa}</strong> no banco em nuvem. Abra o <strong>NexaBI-SyncAgent</strong> no servidor/estação do cliente para iniciar a ingestão contínua dos dados do ERP Próton.
          </div>
        </div>
      )}

      {/* 1. Grade Superior de KPIs com Tooltips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <KPICard label="Venda Bruta" value={temDados ? metricas.vendaBruta : "0,00"} suffix=" Mi" highlight={temDados ? "cyan" : "default"} />
        <KPICard label="Valor Estoque" value={temDados ? metricas.valorEstoque : "0,00"} suffix=" Mi" highlight={temDados ? "purple" : "default"} />
        <KPICard label="Valor CR" value={temDados ? metricas.valorCR : "0,00"} suffix=" Mi" highlight={temDados ? "yellow" : "default"} />
        <KPICard label="Valor CP" value={temDados ? metricas.valorCP : "0,00"} suffix=" Mi" highlight={temDados ? "blue" : "default"} />
        <KPICard label="Contas Financ." value={temDados ? metricas.contasFinanc : "0,00"} suffix=" Mi" highlight={temDados ? "cyan" : "default"} />
        <KPICard label="Margem Bruta" value={temDados ? metricas.margemBruta : "0,00"} suffix=" Mi" highlight={temDados ? "green" : "default"} />
        <KPICard label="Inadimplência" value={temDados ? metricas.inadimplencia : "0,00"} suffix=" Mi" highlight={temDados ? "red" : "default"} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <KPICard label="Qtd. Vendas" value={temDados ? metricas.qtdVendas : "0,00"} suffix={temDados ? " Mil" : " Mi"} />
        <KPICard label="Clientes Compraram" value={temDados ? metricas.clientesCompraram : "0,00"} suffix={temDados ? " Mil" : " Mi"} />
        <KPICard label="Juros Recebidos" value={temDados ? metricas.jurosRecebidos : "0,00"} suffix=" Mi" highlight={temDados ? "green" : "default"} />
        <KPICard label="A Pagar em Atraso" value={temDados ? metricas.aPagarEmAtraso : "0,00"} suffix=" Mi" highlight={temDados ? "red" : "default"} />
        <KPICard label="Vlr Negativo C. Fin" value={temDados ? metricas.vlrNegativoContas : "0,00"} suffix=" Mi" highlight={temDados ? "red" : "default"} />
        <KPICard label="% Margem" value={temDados ? metricas.percMargem : "0,00"} suffix="%" highlight={temDados ? "green" : "default"} />
        <KPICard label="% Inadimplência" value={temDados ? metricas.percInadimplencia : "0,00"} suffix="%" highlight={temDados ? "red" : "default"} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <KPICard label="Venda Bruta do Dia" value={temDados ? metricas.vendaBrutaDia : "0,00"} suffix=" Mi" highlight={temDados ? "cyan" : "default"} />
        <KPICard label="Ticket Médio" value={temDados ? metricas.ticketMedio : "R$ 0,00"} suffix="" />
        <KPICard label="Valor CR - CP" value={temDados ? metricas.valorCRMenosCP : "R$ 0,00"} suffix="" highlight={temDados ? "yellow" : "default"} />
      </div>

      {/* 2. Seção Central: Gauges de Liquidez + Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <LiquidityGauge title="Saldo Total das Contas" value={temDados ? metricas.saldoTotalContasNum : 0} color="#7928ca" max={50} />
          <LiquidityGauge title="(Est. + CR + Ctas) - CP" value={temDados ? metricas.liquidezGeralNum : 0} color="#ef4444" max={50} />
        </div>

        {/* Gráfico de Vendas por Mês */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: 10 }}>
            📈 Histórico de Vendas Mensal (Milhões R$) — ERP Próton
          </h3>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historicoGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="mes" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip 
                  contentStyle={{ background: '#0d1b2a', border: '1px solid #00d2ff', borderRadius: 8, fontSize: 12 }} 
                  formatter={(v) => [`R$ ${v} Mi`, 'Venda']}
                />
                <Bar dataKey="valor" fill="#00d2ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 💡 Seção de Cards & Insights Personalizados da IA */}
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
