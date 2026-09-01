import React, { useState, useEffect } from 'react';
import KPICard from '../components/KPICard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { fetchCompanyMetrics } from '../services/dashboardDataService';


export default function Fiscal({ 
  clienteSelecionado = 'todas', 
  periodoPreset = 'mes_atual', 
  unidade = 'Todas',
  dataInicio = null,
  dataFim = null 
}) {
  const [metricas, setMetricas] = useState({
    impostosDiretos: '0,00',
    percImpostosDiretos: '0,00',
    vendaBruta: '0,00',
    hasData: true
  });

  useEffect(() => {
    fetchCompanyMetrics(clienteSelecionado, periodoPreset, unidade, dataInicio, dataFim).then(data => {
      if (data) setMetricas(data);
    });
  }, [clienteSelecionado, periodoPreset, unidade, dataInicio, dataFim]);

  const temDados = Boolean(metricas && metricas.hasData && parseFloat((metricas.vendaBruta || '0').replace(',', '.')) > 0);
  const impostoDiretoVal = parseFloat((metricas.impostosDiretos || '0').replace(',', '.')) || 0;

  const impostosGerados = [
    { nome: 'Impostos s/ Venda', valor: impostoDiretoVal, cor: '#f59e0b' }
  ];

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
            <strong>Aguardando Sincronização Fiscal:</strong> Nenhuma escrituração fiscal ou documento eletrônico (NF-e/NFC-e) localizado para esta empresa. Execute o <strong>NexaBI-SyncAgent</strong> para carregar o módulo fiscal do ERP Próton.
          </div>
        </div>
      )}

      {/* 3 KPIs Tributários Calculados */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Impostos Diretos" value={temDados ? metricas.impostosDiretos : "0,00"} suffix=" Mi" highlight={temDados ? "yellow" : "default"} />
        <KPICard label="% Carga Tributária" value={temDados ? metricas.percImpostosDiretos : "0,00"} suffix="%" highlight={temDados ? "yellow" : "default"} />
        <KPICard label="Base Faturamento" value={temDados ? metricas.vendaBruta : "0,00"} suffix=" Mi" highlight={temDados ? "cyan" : "default"} />
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Impostos Gerados */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            ⚖️ Estimativa de Tributos Diretos s/ Faturamento (Mi R$)
          </h3>
          <div style={{ width: '100%', height: 220 }}>
            {temDados && impostoDiretoVal > 0 ? (
              <ResponsiveContainer>
                <BarChart data={impostosGerados}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="nome" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ background: 'rgba(14, 25, 44, 0.95)', borderColor: 'rgba(0, 210, 255, 0.4)', borderRadius: 8, color: '#ffffff', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} 
                    itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 600 }}
                    labelStyle={{ color: '#00d2ff', fontWeight: 700 }}
                    formatter={(val) => [`R$ ${Number(val).toFixed(2).replace('.', ',')} Mi`, 'Imposto']}
                  />
                  <Bar dataKey="valor" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                    {impostosGerados.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                Nenhum imposto apurado no período.
              </div>
            )}
          </div>
        </div>

        {/* Informação sobre sincronização de NF-e */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            📑 Escrituração e Livros Fiscais
          </h3>
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            Detalhes por CFOP e Chaves NF-e serão disponibilizados após execução da rotina fiscal no SyncAgent.
          </div>
        </div>
      </div>
    </div>
  );
}
