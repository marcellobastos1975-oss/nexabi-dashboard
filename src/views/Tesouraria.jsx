import React, { useState, useEffect } from 'react';
import KPICard from '../components/KPICard';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line 
} from 'recharts';
import { fetchCompanyMetrics } from '../services/dashboardDataService';

const capitalGiroData = [
  { name: 'Total de Estoque', value: 7.26, color: '#10b981' },
  { name: 'Total Contas a Receber', value: 17.37, color: '#3b82f6' },
  { name: 'Total Contas a Pagar', value: 6.77, color: '#ef4444' },
  { name: 'Total Contas Financeiras', value: 38.96, color: '#00d2ff' },
];

const centrosCusto = [
  { codigo: '201040002', nome: 'AJUSTE DE SALDO BANCÁRIO', entradas: '45.969.605,84', saidas: '38.233.952,77' },
  { codigo: '40198001', nome: 'TRANSFERÊNCIA ENTRE CONTAS', entradas: '11.839.315,81', saidas: '11.834.113,47' },
  { codigo: '101010002', nome: 'DEPÓSITOS DE CLIENTE', entradas: '11.617.762,94', saidas: '12.194.521,26' },
  { codigo: '202140019', nome: 'DEPÓSITO CAIXA ITACARÉ', entradas: '6.599.262,97', saidas: '7.411.643,78' },
  { codigo: '202140017', nome: 'DEPÓSITO CAIXA ITUBERÁ', entradas: '4.695.440,48', saidas: '4.286.273,14' },
  { codigo: '202030001', nome: 'SALÁRIOS E ORDENADOS', entradas: '1.582.664,67', saidas: '16.972,53' },
  { codigo: '202020001', nome: 'ALUGUÉIS E CONDOMÍNIOS', entradas: '1.106.104,88', saidas: '31.581,76' },
];

const fluxoProximos10Dias = [
  { dia: '26/jun', credito: 31.51, debito: 11.31, saldo: 20.20 },
  { dia: '27/jun', credito: 23.26, debito: 14.34, saldo: 8.92 },
  { dia: '28/jun', credito: 24.02, debito: 10.55, saldo: 13.47 },
  { dia: '29/jun', credito: 17.93, debito: 84.83, saldo: -66.90 },
  { dia: '30/jun', credito: 86.33, debito: 63.70, saldo: 22.63 },
  { dia: '01/jul', credito: 32.03, debito: 18.52, saldo: 13.51 },
  { dia: '02/jul', credito: 31.06, debito: 18.06, saldo: 13.00 },
  { dia: '03/jul', credito: 17.61, debito: 18.64, saldo: -1.03 },
  { dia: '04/jul', credito: 17.87, debito: 18.00, saldo: -0.13 },
  { dia: '05/jul', credito: 58.60, debito: 38.62, saldo: 19.98 },
];

export default function Tesouraria({ clienteSelecionado = 'todas', periodoPreset = 'mes_atual', unidade = 'Todas' }) {
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
        contasFinanc: '0,00',
        hasData: false
      };
    }
    return {
      contasFinanc: isFilial3 ? '4,50' : (isFilial1 ? '34,46' : '38,96'),
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
            <strong>Aguardando Sincronização de Tesouraria:</strong> Nenhuma movimentação bancária ou saldo financeiro encontrado para esta empresa. Execute o <strong>NexaBI-SyncAgent</strong> para carregar o módulo de tesouraria do ERP Próton.
          </div>
        </div>
      )}

      {/* 5 KPIs Centrais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        <KPICard label="Saldo Total das Contas" value={temDados ? (isFilial3 ? "0,75" : (isFilial1 ? "5,51" : "6,26")) : "0,00"} suffix=" Mi" highlight={temDados ? "purple" : "default"} />
        <KPICard label="Total Entradas" value={temDados ? (isFilial3 ? "12,50" : (isFilial1 ? "91,85" : "104,35")) : "0,00"} suffix=" Mi" highlight={temDados ? "green" : "default"} />
        <KPICard label="% Entradas" value={temDados ? "55,60" : "0,00"} suffix="%" highlight={temDados ? "green" : "default"} />
        <KPICard label="Total Saídas" value={temDados ? (isFilial3 ? "10,20" : (isFilial1 ? "73,14" : "83,34")) : "0,00"} suffix=" Mi" highlight={temDados ? "blue" : "default"} />
        <KPICard label="% Saídas" value={temDados ? "44,40" : "0,00"} suffix="%" highlight={temDados ? "blue" : "default"} />
      </div>

      {/* Donut Capital de Giro + Centros de Custo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Donut */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>
            🍩 Composição do Capital de Giro
          </h3>
          <div style={{ width: '100%', height: 180 }}>
            {temDados ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie 
                    data={capitalGiroData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={45} 
                    outerRadius={75}
                    paddingAngle={3}
                    stroke="#070d18"
                    strokeWidth={2}
                  >
                    {capitalGiroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(14, 25, 44, 0.95)', 
                      borderColor: 'rgba(0, 210, 255, 0.4)', 
                      borderRadius: 8,
                      color: '#ffffff',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                    }} 
                    itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 600 }}
                    labelStyle={{ color: '#00d2ff', fontWeight: 700 }}
                    formatter={(val, name) => [`R$ ${Number(val).toFixed(2).replace('.', ',')} Mi`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                Nenhum saldo financeiro apurado.
              </div>
            )}
          </div>
          {/* Legenda em texto claro e sem bordas */}
          {temDados && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
              {capitalGiroData.map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <span style={{ color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}:</span>
                  <strong style={{ color: '#ffffff', marginLeft: 'auto' }}>R$ {item.value} Mi</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabela Centros de Custo */}
        <div className="glass-card" style={{ padding: 16, overflowX: 'auto' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 10 }}>
            📑 Total por Centro de Custo
          </h3>
          {temDados ? (
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '6px 4px', textAlign: 'left' }}>Centro de Custo</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>Entradas (R$)</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>Saídas (R$)</th>
                </tr>
              </thead>
              <tbody>
                {centrosCusto.map(cc => (
                  <tr key={cc.codigo} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '6px 4px' }}>{cc.nome}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{cc.entradas}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', color: '#00d2ff', fontWeight: 600 }}>{cc.saidas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '20px 0' }}>
              Nenhum centro de custo movimentado.
            </div>
          )}
        </div>
      </div>

      {/* Fluxo de Caixa dos Próximos 10 Dias */}
      <div className="glass-card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
          📅 Projeção de Fluxo de Caixa — Próximos 10 Dias (Mil R$)
        </h3>
        <div style={{ width: '100%', height: 260 }}>
          {temDados ? (
            <ResponsiveContainer>
              <BarChart data={fluxoProximos10Dias}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="dia" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(14, 25, 44, 0.95)', 
                    borderColor: 'rgba(0, 210, 255, 0.4)', 
                    borderRadius: 8, 
                    color: '#ffffff',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                  }} 
                  itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 600 }}
                  labelStyle={{ color: '#00d2ff', fontWeight: 700 }}
                  formatter={(val, name) => [`R$ ${Number(val).toFixed(2).replace('.', ',')} Mil`, name]}
                />
                <Bar dataKey="credito" fill="#ef4444" name="Crédito" radius={[4, 4, 0, 0]} />
                <Bar dataKey="debito" fill="#3b82f6" name="Débito" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              Nenhuma projeção de fluxo de caixa disponível.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
