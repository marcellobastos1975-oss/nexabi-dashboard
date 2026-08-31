import React, { useState, useEffect } from 'react';
import KPICard from '../components/KPICard';
import LiquidityGauge from '../components/LiquidityGauge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchCompanyMetrics } from '../services/dashboardDataService';

const credoresData = [
  { nome: 'RECEITA FEDERAL DO BRASIL', valor: 715.52 },
  { nome: 'SAMSUNG ELETRÔNICA S/A', valor: 691.20 },
  { nome: 'ELETROLUX DO BRASIL S/A', valor: 385.84 },
  { nome: 'MONDIAL ELETRODOMÉSTICOS', valor: 323.07 },
  { nome: 'INDÚSTRIA BARTIRA MÓVEIS', valor: 300.78 },
  { nome: 'RECONFLEX COLCHÕES IND.', valor: 293.31 },
];

const titulosPagarData = [
  { tipo: 'DUPLICATA DE FORNECEDOR', valor: 425300.00, share: '59,04%', cor: '#10b981' },
  { tipo: 'CHEQUE PRÉ-DATADO EMITIDO', valor: 162900.00, share: '22,61%', cor: '#f59e0b' },
  { tipo: 'IMPOSTO FEDERAL / ESTADUAL', valor: 56200.00, share: '7,80%', cor: '#00d2ff' },
  { tipo: 'FRETE E LOGÍSTICA', valor: 34500.00, share: '4,79%', cor: '#3b82f6' },
  { tipo: 'FOLHA DE PAGAMENTO / RH', valor: 24500.00, share: '3,40%', cor: '#a855f7' },
  { tipo: 'DESPESAS OPERACIONAIS GERAIS', valor: 17000.00, share: '2,36%', cor: '#64748b' },
];

export default function ContasPagar({ clienteSelecionado = 'todas', periodoPreset = 'mes_atual', unidade = 'Todas' }) {
  const isTenantVazio = clienteSelecionado && (
    clienteSelecionado.includes('10.237.062') || 
    clienteSelecionado.includes('f7acf52e') || 
    clienteSelecionado === 'arcoverde'
  );

  const isFilial3 = unidade === '3';
  const isFilial1 = unidade === '1';

  const [metricas, setMetricas] = useState(() => {
    if (isTenantVazio) {
      return {
        valorCP: '0,00',
        hasData: false
      };
    }
    return {
      valorCP: isFilial3 ? '28,91' : (isFilial1 ? '691,50' : '720,40'),
      hasData: true
    };
  });

  useEffect(() => {
    fetchCompanyMetrics(clienteSelecionado, periodoPreset, unidade).then(data => {
      if (data) setMetricas(data);
    });
  }, [clienteSelecionado, periodoPreset, unidade]);

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
            <strong>Aguardando Sincronização de Contas a Pagar:</strong> Nenhum título a pagar encontrado para esta empresa no banco de dados. Execute o <strong>NexaBI-SyncAgent</strong> para carregar o contas a pagar do ERP Próton.
          </div>
        </div>
      )}

      {/* 10 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Total à Pagar" value={metricas.valorCP} suffix=" Mi" highlight={temDados ? "blue" : "default"} />
        <KPICard label="Total à Pagar Vencido" value={temDados ? "160,38" : "0,00"} suffix={temDados ? " Mil" : " Mi"} highlight={temDados ? "red" : "default"} />
        <KPICard label="Total à Vencer" value={temDados ? "720,24" : "0,00"} suffix=" Mi" highlight={temDados ? "green" : "default"} />
        <KPICard label="Prazo Médio Pagto" value={temDados ? "45" : "0"} suffix={temDados ? " Dias" : ""} />
        <KPICard label="Valor Pago Período" value={temDados ? "24,50" : "0,00"} suffix=" Mi" highlight={temDados ? "cyan" : "default"} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="A Pagar à Vista" value={temDados ? "1,20" : "0,00"} suffix=" Mi" highlight={temDados ? "green" : "default"} />
        <KPICard label="A Pagar 30 Dias" value={temDados ? "245,33" : "0,00"} suffix=" Mi" highlight={temDados ? "blue" : "default"} />
        <KPICard label="A Pagar 60 Dias" value={temDados ? "280,97" : "0,00"} suffix=" Mi" highlight={temDados ? "yellow" : "default"} />
        <KPICard label="A Pagar 90 Dias" value={temDados ? "192,90" : "0,00"} suffix=" Mi" highlight={temDados ? "purple" : "default"} />
        <KPICard label="% 10 Maiores Fornec." value={temDados ? "53,57" : "0,00"} suffix="%" />
      </div>

      {/* Gauges de Inadimplência Fornecedores */}
      <div className="glass-card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
          🛡️ Indicadores de Atraso e Risco de Suprimentos
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <LiquidityGauge title="Inadimplência Geral" value={temDados ? 0.02 : 0} color="#10b981" max={20} unit="%" />
          <LiquidityGauge title="Atraso >30 dias" value={temDados ? 0.01 : 0} color="#10b981" max={10} unit="%" />
          <LiquidityGauge title="Atraso >60 dias" value={temDados ? 0.01 : 0} color="#10b981" max={10} unit="%" />
          <LiquidityGauge title="Atraso >90 dias" value={temDados ? 0.00 : 0} color="#10b981" max={10} unit="%" />
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
            {temDados ? (
              <ResponsiveContainer>
                <BarChart data={credoresData}>
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
