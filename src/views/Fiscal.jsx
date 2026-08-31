import React, { useState, useEffect } from 'react';
import KPICard from '../components/KPICard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { fetchCompanyMetrics } from '../services/dashboardDataService';

const impostosGerados = [
  { nome: 'Saldo Imposto', valor: 3.24, cor: '#10b981' },
  { nome: 'Imposto Entrada', valor: 9.40, cor: '#3b82f6' },
  { nome: 'Imposto Saídas', valor: 12.64, cor: '#f59e0b' },
];

const saidasCFOP = [
  { cfop: 'VM - Venda Mercadorias', valor: 11324.65, cor: '#3b82f6' },
  { cfop: 'TS - Transferência Saída', valor: 1217.44, cor: '#10b981' },
  { cfop: 'DF - Devolução Fornecedor', valor: 74.56, cor: '#f59e0b' },
  { cfop: 'SP - Simples Remessa', valor: 19.55, cor: '#00d2ff' },
];

const entradasCFOP = [
  { cfop: 'CO - Compras p/ Comercialização', valor: 8084.07, cor: '#10b981' },
  { cfop: 'TE - Transferência Entrada', valor: 1163.15, cor: '#3b82f6' },
  { cfop: 'DC - Devolução de Clientes', valor: 69.51, cor: '#00d2ff' },
  { cfop: 'BE - Bonificação Entrada', valor: 43.77, cor: '#f59e0b' },
];

export default function Fiscal({ clienteSelecionado = 'todas', periodoPreset = 'mes_atual', unidade = 'Todas' }) {
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
        impostosDiretos: '0,00',
        hasData: false
      };
    }
    return {
      impostosDiretos: isFilial3 ? '5,21' : (isFilial1 ? '5,62' : '6,26'),
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
            <strong>Aguardando Sincronização Fiscal:</strong> Nenhuma escrituração fiscal ou documento eletrônico (NF-e/NFC-e) localizado para esta empresa. Execute o <strong>NexaBI-SyncAgent</strong> para carregar o módulo fiscal do ERP Próton.
          </div>
        </div>
      )}

      {/* 12 KPIs Tributários */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Saldo do Imposto" value={temDados ? (isFilial3 ? "0,35" : (isFilial1 ? "2,89" : "3,24")) : "0,00"} suffix=" Mi" highlight={temDados ? "green" : "default"} />
        <KPICard label="Imposto Entradas" value={temDados ? (isFilial3 ? "1,05" : (isFilial1 ? "8,35" : "9,40")) : "0,00"} suffix=" Mi" highlight={temDados ? "blue" : "default"} />
        <KPICard label="Imposto Saídas" value={temDados ? metricas.impostosDiretos : "0,00"} suffix=" Mi" highlight={temDados ? "yellow" : "default"} />
        <KPICard label="Valor ICMS Venda" value={temDados ? (isFilial3 ? "1,12" : (isFilial1 ? "9,02" : "10,14")) : "0,00"} suffix=" Mi" />
        <KPICard label="Valor PIS Venda" value={temDados ? (isFilial3 ? "23,10" : (isFilial1 ? "187,61" : "210,71")) : "0,00"} suffix={temDados ? " Mil" : " Mi"} />
        <KPICard label="Valor COFINS Venda" value={temDados ? (isFilial3 ? "106,50" : (isFilial1 ? "865,98" : "972,48")) : "0,00"} suffix={temDados ? " Mil" : " Mi"} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Carga Tributária" value={temDados ? "21,02" : "0,00"} suffix="%" highlight={temDados ? "yellow" : "default"} />
        <KPICard label="Isentas / Outras" value={temDados ? (isFilial3 ? "0,80" : (isFilial1 ? "6,74" : "7,54")) : "0,00"} suffix=" Mi" />
        <KPICard label="Vendas NF-e (55)" value={temDados ? (isFilial3 ? "15,10" : (isFilial1 ? "122,53" : "137,63")) : "0,00"} suffix=" Mi" highlight={temDados ? "cyan" : "default"} />
        <KPICard label="Vendas NFC-e (65)" value={temDados ? (isFilial3 ? "0,72" : (isFilial1 ? "5,93" : "6,65")) : "0,00"} suffix=" Mi" highlight={temDados ? "cyan" : "default"} />
        <KPICard label="IBS Venda (Reforma)" value={temDados ? "4,54" : "0,00"} suffix={temDados ? " Mil" : " Mi"} highlight={temDados ? "purple" : "default"} />
        <KPICard label="CBS Venda (Reforma)" value={temDados ? "40,81" : "0,00"} suffix={temDados ? " Mil" : " Mi"} highlight={temDados ? "purple" : "default"} />
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Impostos Gerados */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            ⚖️ Impostos Gerados (Mi R$)
          </h3>
          <div style={{ width: '100%', height: 220 }}>
            {temDados ? (
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
                  <Bar dataKey="valor" fill="#00d2ff" radius={[4, 4, 0, 0]}>
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

        {/* Saídas por Natureza */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            📤 Impostos por Natureza de Operação (Saídas)
          </h3>
          {temDados ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {saidasCFOP.map(s => (
                <div key={s.cfop} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 4 }}>
                  <span>{s.cfop}</span>
                  <strong style={{ color: s.cor }}>R$ {s.valor.toLocaleString('pt-BR')} Mil</strong>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '20px 0' }}>
              Nenhuma operação fiscal registrada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
