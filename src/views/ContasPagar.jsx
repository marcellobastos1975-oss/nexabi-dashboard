import React, { useState, useEffect } from 'react';
import KPICard from '../components/KPICard';
import LiquidityGauge from '../components/LiquidityGauge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchCompanyMetrics } from '../services/dashboardDataService';


const titulosPagarData = [
  { tipo: 'DUPLICATA DE FORNECEDOR', valor: 425300.00, share: '59,04%', cor: '#10b981' },
  { tipo: 'CHEQUE PRÉ-DATADO EMITIDO', valor: 162900.00, share: '22,61%', cor: '#f59e0b' },
  { tipo: 'IMPOSTO FEDERAL / ESTADUAL', valor: 56200.00, share: '7,80%', cor: '#00d2ff' },
  { tipo: 'FRETE E LOGÍSTICA', valor: 34500.00, share: '4,79%', cor: '#3b82f6' },
  { tipo: 'FOLHA DE PAGAMENTO / RH', valor: 24500.00, share: '3,40%', cor: '#a855f7' },
  { tipo: 'DESPESAS OPERACIONAIS GERAIS', valor: 17000.00, share: '2,36%', cor: '#64748b' },
];

export default function ContasPagar({ 
  clienteSelecionado = 'todas', 
  periodoPreset = 'mes_atual', 
  unidade = 'Todas',
  dataInicio = null,
  dataFim = null 
}) {
  const [metricas, setMetricas] = useState({
    valorCP: '0,00',
    cpVencido: '0,00',
    cpAVencer: '0,00',
    cpPrazoMedio: '0',
    cpPagoPeriodo: '0,00',
    cpVista: '0,00',
    cp30d: '0,00',
    cp60d: '0,00',
    cp90d: '0,00',
    topCredores: [],
    hasData: true
  });

  useEffect(() => {
    fetchCompanyMetrics(clienteSelecionado, periodoPreset, unidade, dataInicio, dataFim).then(data => {
      if (data) setMetricas(data);
    });
  }, [clienteSelecionado, periodoPreset, unidade, dataInicio, dataFim]);

  const temDados = Boolean(metricas && metricas.hasData);
  const listaCredores = (temDados && metricas.topCredores && metricas.topCredores.length > 0) ? metricas.topCredores : [];

  const cpTotalNum = parseFloat((metricas.valorCP || '0').replace(',', '.')) || 0;
  const cpVencidoNum = parseFloat((metricas.cpVencido || '0').replace(',', '.')) || 0;
  const percAtrasoCP = cpTotalNum > 0 ? Math.round((cpVencidoNum / cpTotalNum) * 100) : 0;

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
            <strong>Aguardando Sincronização de Contas a Pagar:</strong> Nenhum título a pagar encontrado para esta empresa no banco de dados. Execute o <strong>NexaBI-SyncAgent</strong> para carregar o contas a pagar do ERP Próton.
          </div>
        </div>
      )}

      {/* 10 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Total à Pagar" value={metricas.valorCP} suffix=" Mi" highlight={temDados ? "blue" : "default"} />
        <KPICard label="Total à Pagar Vencido" value={temDados ? metricas.cpVencido : "0,00"} suffix=" Mi" highlight={temDados ? "red" : "default"} />
        <KPICard label="Total à Vencer" value={temDados ? metricas.cpAVencer : "0,00"} suffix=" Mi" highlight={temDados ? "green" : "default"} />
        <KPICard label="Prazo Médio Pagto" value={temDados ? metricas.cpPrazoMedio : "0"} suffix={temDados ? " Dias" : ""} />
        <KPICard label="Valor Pago Período" value={temDados ? metricas.cpPagoPeriodo : "0,00"} suffix=" Mi" highlight={temDados ? "cyan" : "default"} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="A Pagar à Vista" value={temDados ? metricas.cpVista : "0,00"} suffix=" Mi" highlight={temDados ? "green" : "default"} />
        <KPICard label="A Pagar 30 Dias" value={temDados ? metricas.cp30d : "0,00"} suffix=" Mi" highlight={temDados ? "blue" : "default"} />
        <KPICard label="A Pagar 60 Dias" value={temDados ? metricas.cp60d : "0,00"} suffix=" Mi" highlight={temDados ? "yellow" : "default"} />
        <KPICard label="A Pagar 90 Dias" value={temDados ? metricas.cp90d : "0,00"} suffix=" Mi" highlight={temDados ? "purple" : "default"} />
        <KPICard label="% Em Atraso" value={percAtrasoCP.toString()} suffix="%" highlight={percAtrasoCP > 20 ? "red" : "default"} />
      </div>

      {/* Gauges de Inadimplência Fornecedores */}
      <div className="glass-card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
          🛡️ Indicadores de Atraso e Risco de Suprimentos
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <LiquidityGauge title="Atraso Geral" value={percAtrasoCP} color={percAtrasoCP > 20 ? "#ef4444" : "#10b981"} max={100} unit="%" />
          <LiquidityGauge title="Atraso >30 dias" value={Math.round(percAtrasoCP * 0.7)} color="#f59e0b" max={100} unit="%" />
          <LiquidityGauge title="Atraso >60 dias" value={Math.round(percAtrasoCP * 0.4)} color="#3b82f6" max={100} unit="%" />
          <LiquidityGauge title="Crítica (>90 dias)" value={Math.round(percAtrasoCP * 0.25)} color="#ef4444" max={100} unit="%" />
        </div>
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Top Credores */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            🏛️ Maiores Credores &amp; Fornecedores a Pagar (Mil R$)
          </h3>
          <div style={{ width: '100%', height: 240 }}>
            {listaCredores.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={listaCredores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="nome" stroke="var(--text-muted)" fontSize={9} interval={0} angle={-15} textAnchor="end" height={45} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ background: 'rgba(14, 25, 44, 0.95)', borderColor: 'rgba(0, 210, 255, 0.4)', borderRadius: 8, color: '#ffffff' }} 
                    formatter={(val) => [`R$ ${Number(val).toLocaleString('pt-BR')} Mil`, 'A Pagar']}
                  />
                  <Bar dataKey="valor" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                Nenhum título a pagar registrado.
              </div>
            )}
          </div>
        </div>

        {/* Tipo de Título */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            📑 Obrigações a Pagar por Modalidade
          </h3>
          {temDados ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {titulosPagarData.map(t => (
                <div key={t.tipo} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>{t.tipo}</span>
                    <strong>R$ {t.valor.toLocaleString('pt-BR')} Mil ({t.share})</strong>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                    <div style={{ width: t.share, height: '100%', background: t.cor, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              Nenhuma obrigação financeira pendente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
