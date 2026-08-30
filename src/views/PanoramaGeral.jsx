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

const historicoVendas12mReal = [
  { mes: '2026-jan', valor: 24.50 },
  { mes: '2026-fev', valor: 23.03 },
  { mes: '2026-mar', valor: 29.69 },
  { mes: '2026-abr', valor: 28.05 },
  { mes: '2026-mai', valor: 27.29 },
  { mes: '2026-jun', valor: 28.22 },
  { mes: '2026-jul', valor: 29.18 },
  { mes: '2026-ago', valor: 26.74 },
];

const treemapDataReal = [
  { name: 'Venda Bruta', size: 216.70, fill: '#059669' },
  { name: 'Valor CR', size: 321.55, fill: '#d97706' },
  { name: 'Valor CP', size: 720.40, fill: '#dc2626' },
  { name: 'Vr Estoque', size: 7.26, fill: '#2563eb' },
  { name: 'Vr Contas', size: 38.96, fill: '#0891b2' }
];

export default function PanoramaGeral({ 
  isRealEmptyTenant = false, 
  nomeEmpresa = 'DESTAK PRIME', 
  periodoDesc = 'Mês Atual', 
  clienteSelecionado = 'todas',
  periodoPreset = 'mes_atual'
}) {
  const [widgetsCustomizados, setWidgetsCustomizados] = useState([]);
  const [metricas, setMetricas] = useState({
    vendaBruta: '26,74',
    vendaLiquida: '26,74',
    qtdVendas: '12,05',
    ticketMedio: 'R$ 2.219,62',
    valorCR: '321,55',
    valorCP: '720,40',
    valorEstoque: '7,26',
    contasFinanc: '38,96',
    margemBruta: '14,71',
    inadimplencia: '38,58'
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
    fetchCompanyMetrics(clienteSelecionado, periodoPreset).then(setMetricas);
  }, [clienteSelecionado, periodoPreset]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Grade Superior de KPIs com Tooltips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <KPICard label="Venda Bruta" value={metricas.vendaBruta} suffix=" Mi" highlight="cyan" />
        <KPICard label="Valor Estoque" value={metricas.valorEstoque} suffix=" Mi" highlight="purple" />
        <KPICard label="Valor CR" value={metricas.valorCR} suffix=" Mi" highlight="yellow" />
        <KPICard label="Valor CP" value={metricas.valorCP} suffix=" Mi" highlight="blue" />
        <KPICard label="Contas Financ." value={metricas.contasFinanc} suffix=" Mi" highlight="cyan" />
        <KPICard label="Margem Bruta" value={metricas.margemBruta} suffix=" Mi" highlight="green" />
        <KPICard label="Inadimplência" value={metricas.inadimplencia} suffix=" Mi" highlight="red" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <KPICard label="Qtd. Vendas" value={metricas.qtdVendas} suffix=" Mil" />
        <KPICard label="Clientes Compraram" value="12,05" suffix=" Mil" />
        <KPICard label="Juros Recebidos" value="2,93" suffix=" Mi" highlight="green" />
        <KPICard label="A Pagar em Atraso" value="160,38" suffix=" Mil" highlight="red" />
        <KPICard label="Vlr Negativo C. Fin" value="-32,70" suffix=" Mi" highlight="red" />
        <KPICard label="% Margem" value="55,00" suffix="%" highlight="green" />
        <KPICard label="% Inadimplência" value="12,00" suffix="%" highlight="red" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <KPICard label="Venda Bruta do Dia" value="1,12" suffix=" Mi" highlight="cyan" />
        <KPICard label="Ticket Médio" value={metricas.ticketMedio} suffix="" />
        <KPICard label="Valor CR - CP" value="R$ -398,85" suffix=" Mi" highlight="yellow" />
      </div>

      {/* 2. Seção Central: Gauges de Liquidez + Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <LiquidityGauge title="Saldo Total das Contas" value={38.96} color="#7928ca" max={50} />
          <LiquidityGauge title="(Est. + CR + Ctas) - CP" value={-352.63} color="#ef4444" max={50} />
        </div>

        {/* Gráfico de Vendas por Mês */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: 10 }}>
            📈 Histórico de Vendas Mensal (Milhões R$) — ERP Próton
          </h3>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historicoVendas12mReal}>
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
