import React, { useState, useEffect } from 'react';
import KPICard from '../components/KPICard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, TrendingDown, Package, Award } from 'lucide-react';
import { fetchCompanyMetrics } from '../services/dashboardDataService';


export default function Estoques({ 
  clienteSelecionado = 'todas', 
  periodoPreset = 'mes_atual', 
  unidade = 'Todas',
  dataInicio = null,
  dataFim = null 
}) {
  const [abaEstoque, setAbaEstoque] = useState('mais_vendidos');

  const [metricas, setMetricas] = useState({
    valorEstoque: '0,00',
    valorEstoqueVenda: '0,00',
    margemBruta: '0,00',
    estoqueParado90d: '0,00',
    produtosEmLinha: '0',
    estoqueItensSemGiro: '0',
    estoqueGiroAnual: '0,0',
    estoqueDuracaoDias: '0',
    estoqueMargemPerc: '0,00',
    curvaABC: [],
    topProdutos: [],
    hasData: true
  });

  useEffect(() => {
    fetchCompanyMetrics(clienteSelecionado, periodoPreset, unidade, dataInicio, dataFim).then(data => {
      if (data) setMetricas(data);
    });
  }, [clienteSelecionado, periodoPreset, unidade, dataInicio, dataFim]);

  const temDados = Boolean(metricas && metricas.hasData);
  const listaProdutos = (temDados && metricas.topProdutos && metricas.topProdutos.length > 0) ? metricas.topProdutos : [];
  const listaCurvaABC = (temDados && metricas.curvaABC && metricas.curvaABC.length > 0) ? metricas.curvaABC : [];

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
            <strong>Aguardando Sincronização de Estoques:</strong> Nenhum item de estoque registrado para esta empresa no banco de dados. Execute o <strong>NexaBI-SyncAgent</strong> para carregar os saldos de estoque do ERP Próton.
          </div>
        </div>
      )}

      {/* 8 KPIs de Decisão de Estoque */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Valor de Estoque" value={metricas.valorEstoque} suffix=" Mi" highlight={temDados ? "purple" : "default"} />
        <KPICard label="Valor a Preço Venda" value={metricas.valorEstoqueVenda} suffix=" Mi" highlight={temDados ? "blue" : "default"} />
        <KPICard label="Duração Estoque" value={temDados ? metricas.estoqueDuracaoDias : "0"} suffix={temDados ? " Dias" : ""} highlight={temDados ? "green" : "default"} />
        <KPICard label="Estoque Parado (>90d)" value={temDados ? metricas.estoqueParado90d : "0,00"} suffix=" Mi" highlight={temDados ? "red" : "default"} />
        <KPICard label="Giro de Estoque" value={temDados ? metricas.estoqueGiroAnual : "0,0"} suffix={temDados ? "x / ano" : ""} highlight={temDados ? "cyan" : "default"} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Valor da Margem" value={temDados ? metricas.margemBruta : "0,00"} suffix=" Mi" highlight={temDados ? "green" : "default"} />
        <KPICard label="% Margem Bruta" value={temDados ? metricas.estoqueMargemPerc : "0,00"} suffix="%" highlight={temDados ? "green" : "default"} />
        <KPICard label="Produtos em Linha" value={temDados ? metricas.produtosEmLinha : "0"} suffix={temDados ? " Itens" : ""} highlight={temDados ? "cyan" : "default"} />
        <KPICard label="Itens Sem Giro" value={temDados ? metricas.estoqueItensSemGiro : "0"} suffix={temDados ? " Itens" : ""} highlight={temDados ? "red" : "default"} />
      </div>

      {/* Alerta de Decisão Executiva */}
      {temDados && (
        <div style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(245, 158, 11, 0.15) 100%)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.25)', padding: 10, borderRadius: 10, color: '#ef4444' }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#fca5a5' }}>
                Diagnóstico Analítico de Estoque — ERP Próton
              </h4>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#e2e8f0' }}>
                Estoque total avaliado a custo em <strong>R$ {metricas.valorEstoque} Milhões</strong> ({metricas.produtosEmLinha} produtos em linha). Margem média projetada de <strong>{metricas.estoqueMargemPerc}%</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Seção Principal: Tabelas Dinâmicas de Decisão */}
      <div className="glass-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12, marginBottom: 14 }}>
          <button 
            onClick={() => setAbaEstoque('mais_vendidos')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              background: abaEstoque === 'mais_vendidos' ? 'linear-gradient(135deg, #00d2ff 0%, #0052cc 100%)' : 'rgba(255,255,255,0.05)',
              color: '#ffffff',
              border: abaEstoque === 'mais_vendidos' ? '1px solid #00d2ff' : '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Award size={15} /> Top Mercadorias em Estoque
          </button>

          <button 
            onClick={() => setAbaEstoque('curva_abc')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              background: abaEstoque === 'curva_abc' ? 'linear-gradient(135deg, #10b981 0%, #047857 100%)' : 'rgba(255,255,255,0.05)',
              color: '#ffffff',
              border: abaEstoque === 'curva_abc' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Package size={15} /> Curva ABC de Produtos
          </button>
        </div>

        {/* 1. ABA MAIS VENDIDOS / PRODUTOS EM ESTOQUE */}
        {abaEstoque === 'mais_vendidos' && (
          listaProdutos.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px 6px' }}>Cód.</th>
                    <th style={{ padding: '8px 6px' }}>Descrição da Mercadoria</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Estoque Atual</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Valor Custo (R$)</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Valor Venda (R$)</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {listaProdutos.map(p => (
                    <tr key={p.cod} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '8px 6px', color: '#94a3b8' }}>#{p.cod}</td>
                      <td style={{ padding: '8px 6px', fontWeight: 700, color: '#ffffff' }}>{p.nome}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: '#00d2ff' }}>{Number(p.qtdEstoque).toLocaleString('pt-BR')} un</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600, color: '#f8fafc' }}>R$ {Number(p.valorCusto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', color: '#10b981', fontWeight: 700 }}>R$ {Number(p.valorVenda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: p.status === 'PARADO' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: p.status === 'PARADO' ? '#fca5a5' : '#34d399', border: p.status === 'PARADO' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(16,185,129,0.3)' }}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              Nenhum produto cadastrado para este tenant no período selecionado.
            </div>
          )
        )}

        {/* 2. ABA CURVA ABC */}
        {abaEstoque === 'curva_abc' && (
          listaCurvaABC.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={listaCurvaABC}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="classe" stroke="var(--text-muted)" fontSize={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ background: 'rgba(14, 25, 44, 0.95)', borderColor: 'rgba(0, 210, 255, 0.4)', borderRadius: 8, color: '#ffffff' }} 
                      formatter={(val) => [`R$ ${val} Mi`, 'Valor']}
                    />
                    <Bar dataKey="valor" fill="#10b981" radius={[4, 4, 0, 0]}>
                      {listaCurvaABC.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor || '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
                {listaCurvaABC.map(c => (
                  <div key={c.classe} style={{ background: `${c.cor}15`, border: `1px solid ${c.cor}`, padding: 12, borderRadius: 10 }}>
                    <strong style={{ color: c.cor, fontSize: 13 }}>{c.classe}:</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#e2e8f0' }}>{c.itens} — Totalizando R$ {c.valor} Milhões em estoque.</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              Curva ABC aguardando primeira ingestão de estoque e vendas.
            </div>
          )
        )}
      </div>
    </div>
  );
}
