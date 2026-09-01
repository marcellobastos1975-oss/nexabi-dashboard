import React, { useState, useEffect } from 'react';
import KPICard from '../components/KPICard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line 
} from 'recharts';
import { fetchCompanyMetrics } from '../services/dashboardDataService';


export default function Compras({ 
  clienteSelecionado = 'todas', 
  periodoPreset = 'mes_atual', 
  unidade = 'Todas',
  dataInicio = null,
  dataFim = null 
}) {
  const [metricas, setMetricas] = useState({
    hasData: false
  });

  useEffect(() => {
    fetchCompanyMetrics(clienteSelecionado, periodoPreset, unidade, dataInicio, dataFim).then(data => {
      if (data) setMetricas(data);
    });
  }, [clienteSelecionado, periodoPreset, unidade, dataInicio, dataFim]);

  // bi_compras aguarda primeira sincronização de pedidos de fornecedores
  const temDados = false;
  const leadTimeData = [];
  const comprasFornecedor = [];

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
            <strong>Aguardando Sincronização de Compras:</strong> Nenhum pedido de compra encontrado para esta empresa no banco de dados. Execute o <strong>NexaBI-SyncAgent</strong> para carregar o módulo de compras do ERP Próton.
          </div>
        </div>
      )}

      {/* 8 KPIs Principais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Valor das Compras" value={temDados ? "1,16" : "0,00"} suffix=" Mi" highlight={temDados ? "cyan" : "default"} />
        <KPICard label="Prazo Médio Compras" value={temDados ? "18" : "0"} suffix={temDados ? " DIAS" : ""} highlight={temDados ? "blue" : "default"} />
        <KPICard label="Compras 5 Maiores" value={temDados ? "1.094,94" : "0,00"} suffix={temDados ? " Mil" : " Mi"} highlight={temDados ? "purple" : "default"} />
        <KPICard label="% 5 Maiores Fornec." value={temDados ? "94,47" : "0,00"} suffix="%" />
        <KPICard label="Pedidos Feitos" value={temDados ? "382" : "0"} />
        <KPICard label="Pedidos Não Entregues" value={temDados ? "36" : "0"} highlight={temDados ? "yellow" : "default"} />
        <KPICard label="% Não Entregues" value={temDados ? "9,42" : "0,00"} suffix="%" highlight={temDados ? "yellow" : "default"} />
        <KPICard label="% Compras à Vista" value={temDados ? "1,83" : "0,00"} suffix="%" />
      </div>

      {/* Gráficos de Lead Time e Fornecedores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Lead Time */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            ⏱️ Lead Time — Tempo Decorrido (Dias até Entrega do Fornecedor)
          </h3>
          <div style={{ width: '100%', height: 240 }}>
            {temDados ? (
              <ResponsiveContainer>
                <LineChart data={leadTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="fornecedor" stroke="var(--text-muted)" fontSize={9} interval={0} angle={-15} textAnchor="end" height={45} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ background: 'rgba(14, 25, 44, 0.95)', borderColor: 'rgba(0, 210, 255, 0.4)', borderRadius: 8, color: '#ffffff' }} 
                    formatter={(val) => [`${val} Dias`, 'Prazo de Entrega']}
                  />
                  <Line type="monotone" dataKey="dias" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                Nenhum lead time calculado.
              </div>
            )}
          </div>
        </div>

        {/* Compras por Fornecedor (Sem Corte de Nomes) */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            🏭 Principais Fornecedores de Compras (Mil R$)
          </h3>
          {temDados ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {comprasFornecedor.map(f => (
                <div key={f.nome} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 6 }}>
                  <span style={{ color: '#f8fafc', fontWeight: 600, maxWidth: '60%' }}>{f.nome}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: '#00d2ff', marginRight: 8 }}>R$ {f.valor} Mil</span>
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>({f.share})</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              Nenhum fornecedor registrado.
            </div>
          )}
        </div>
      </div>

      {/* Comparativos Fiscais */}
      {temDados && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <div className="glass-card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
              🚚 Compras: Dentro vs Fora do Estado (Origem Tributária)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '10px 0' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 4 }}>
                  <span>Fora do Estado (Interestadual)</span>
                  <strong style={{ color: '#38bdf8' }}>78,35%</strong>
                </div>
                <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5 }}>
                  <div style={{ width: '78.35%', height: '100%', background: '#38bdf8', borderRadius: 5 }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 4 }}>
                  <span>Dentro do Estado (Bahia)</span>
                  <strong style={{ color: '#10b981' }}>21,65%</strong>
                </div>
                <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5 }}>
                  <div style={{ width: '21.65%', height: '100%', background: '#10b981', borderRadius: 5 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
