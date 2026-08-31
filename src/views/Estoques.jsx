import React, { useState } from 'react';
import KPICard from '../components/KPICard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, TrendingDown, Package, Award } from 'lucide-react';

const topProdutosMaisVendidos = [
  { cod: '1042', nome: 'SMART TV 50" 4K UHD CRYSTAL HDR', qtdVendida: 480, estoqueAtual: 142, coberturaDias: 9, status: 'GIRO ALTO' },
  { cod: '2150', nome: 'REFRIGERADOR FROST FREE 375L INOX', qtdVendida: 310, estoqueAtual: 85, coberturaDias: 8, status: 'GIRO ALTO' },
  { cod: '3890', nome: 'SMARTPHONE 128GB 5G TELA 6.6"', qtdVendida: 590, estoqueAtual: 210, coberturaDias: 11, status: 'GIRO ALTO' },
  { cod: '1105', nome: 'FOGÃO 4 BOCAS AUTOMÁTICO INOX', qtdVendida: 240, estoqueAtual: 98, coberturaDias: 12, status: 'GIRO NORMAL' },
  { cod: '4502', nome: 'CONJUNTO ESTOFADO 3 E 2 LUGARES SUEDE', qtdVendida: 185, estoqueAtual: 64, coberturaDias: 10, status: 'GIRO NORMAL' },
];

const estoqueParadoData = [
  { cod: '9012', nome: 'LAVADORA DE ROUPAS 15KG PREMIUM', diasParado: 124, qtdParada: 52, valorImobilizado: 142800.00, acao: 'Promoção Queima' },
  { cod: '8410', nome: 'PAINEL HOME THEATER 2.20M CARVALHO', diasParado: 110, qtdParada: 74, valorImobilizado: 118400.00, acao: 'Remanejar Filiais' },
  { cod: '7301', nome: 'SMART TV 65" 8K NEO QLED', diasParado: 98, qtdParada: 14, valorImobilizado: 98600.00, acao: 'Desconto à Vista' },
  { cod: '6220', nome: 'COLCHÃO QUEEN SIZE MOLAS ENSACADAS', diasParado: 95, qtdParada: 45, valorImobilizado: 87300.00, acao: 'Campanha Vendedores' },
  { cod: '5118', nome: 'FORNO ELETRÔNICO DE EMBUTIR 80L', diasParado: 92, qtdParada: 38, valorImobilizado: 76500.00, acao: 'Promoção Queima' },
];

const paretoData = [
  { classe: 'Curva A (80% da Receita)', itens: '1.205 produtos', valor: 5.80, perc: 80, cor: '#10b981' },
  { classe: 'Curva B (15% da Receita)', itens: '2.140 produtos', valor: 1.09, perc: 15, cor: '#3b82f6' },
  { classe: 'Curva C (5% da Receita)', itens: '2.661 produtos', valor: 0.37, perc: 5, cor: '#f59e0b' },
];

export default function Estoques() {
  const [abaEstoque, setAbaEstoque] = useState('mais_vendidos');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 8 KPIs de Decisão de Estoque */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Valor de Estoque" value="7,26" suffix=" Mi" highlight="purple" />
        <KPICard label="Preço de Custo" value="3,30" suffix=" Mi" highlight="blue" />
        <KPICard label="Duração Estoque" value="32" suffix=" Dias" highlight="green" />
        <KPICard label="Estoque Parado (>90d)" value="1,28" suffix=" Mi" highlight="red" />
        <KPICard label="Giro de Estoque" value="11,4" suffix="x / ano" highlight="cyan" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Valor da Margem" value="3,96" suffix=" Mi" highlight="green" />
        <KPICard label="% Margem Bruta" value="54,61" suffix="%" highlight="green" />
        <KPICard label="% Ruptura Estoque" value="2,83" suffix="%" highlight="yellow" />
        <KPICard label="Produtos em Linha" value="6.006" suffix=" Itens" highlight="cyan" />
        <KPICard label="Itens Sem Giro" value="342" suffix=" Itens" highlight="red" />
      </div>

      {/* Alerta de Decisão Executiva */}
      <div style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(245, 158, 11, 0.15) 100%)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.25)', padding: 10, borderRadius: 10, color: '#ef4444' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#fca5a5' }}>
              Diagnóstico Analítico de Giro de Estoque (ERP Próton)
            </h4>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#e2e8f0' }}>
              Há <strong>R$ 1,28 Milhões</strong> em mercadorias paradas há mais de 90 dias. Ações recomendadas: Queima promocional em crediário e remanejamento entre filiais.
            </p>
          </div>
        </div>
      </div>

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
            <Award size={15} /> Top Mercadorias Mais Vendidas vs Saldo
          </button>

          <button 
            onClick={() => setAbaEstoque('parados')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              background: abaEstoque === 'parados' ? 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)' : 'rgba(255,255,255,0.05)',
              color: '#ffffff',
              border: abaEstoque === 'parados' ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <TrendingDown size={15} /> Estoque Parado / Sem Giro (&gt; 90 Dias)
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
            <Package size={15} /> Curva ABC de Produtos (Pareto 80/15/5)
          </button>
        </div>

        {/* 1. ABA MAIS VENDIDOS */}
        {abaEstoque === 'mais_vendidos' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 6px' }}>Cód.</th>
                  <th style={{ padding: '8px 6px' }}>Descrição da Mercadoria</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Qtd. Vendida (Mês)</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Estoque Disponível</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Cobertura</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center' }}>Classificação</th>
                </tr>
              </thead>
              <tbody>
                {topProdutosMaisVendidos.map(p => (
                  <tr key={p.cod} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px 6px', color: '#94a3b8' }}>#{p.cod}</td>
                    <td style={{ padding: '8px 6px', fontWeight: 700, color: '#ffffff' }}>{p.nome}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: '#00d2ff' }}>{p.qtdVendida} un</td>
                    <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600, color: '#f8fafc' }}>{p.estoqueAtual} un</td>
                    <td style={{ padding: '8px 6px', textAlign: 'right', color: '#10b981', fontWeight: 700 }}>{p.coberturaDias} dias</td>
                    <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. ABA ESTOQUE PARADO */}
        {abaEstoque === 'parados' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 6px' }}>Cód.</th>
                  <th style={{ padding: '8px 6px' }}>Mercadoria com Giro Lento</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Dias Sem Venda</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Saldo Parado</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Valor Imobilizado (R$)</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center' }}>Recomendação IA</th>
                </tr>
              </thead>
              <tbody>
                {estoqueParadoData.map(p => (
                  <tr key={p.cod} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px 6px', color: '#94a3b8' }}>#{p.cod}</td>
                    <td style={{ padding: '8px 6px', fontWeight: 700, color: '#ffffff' }}>{p.nome}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 800, color: '#ef4444' }}>{p.diasParado} dias</td>
                    <td style={{ padding: '8px 6px', textAlign: 'right', color: '#f8fafc', fontWeight: 600 }}>{p.qtdParada} un</td>
                    <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: '#fbbf24' }}>
                      R$ {p.valorImobilizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
                        ⚡ {p.acao}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. ABA CURVA ABC */}
        {abaEstoque === 'curva_abc' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paretoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="classe" stroke="var(--text-muted)" fontSize={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ background: 'rgba(14, 25, 44, 0.95)', borderColor: 'rgba(0, 210, 255, 0.4)', borderRadius: 8, color: '#ffffff' }} 
                    formatter={(val) => [`R$ ${val} Mi`, 'Valor']}
                  />
                  <Bar dataKey="valor" fill="#10b981" radius={[4, 4, 0, 0]}>
                    {paretoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', padding: 12, borderRadius: 10 }}>
                <strong style={{ color: '#34d399', fontSize: 13 }}>🟢 Classe A (80% da Receita):</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#e2e8f0' }}>1.205 produtos de alto giro (Smart TVs, Celulares, Fogões). Risco de ruptura crítico.</p>
              </div>
              <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid #3b82f6', padding: 12, borderRadius: 10 }}>
                <strong style={{ color: '#60a5fa', fontSize: 13 }}>🔵 Classe B (15% da Receita):</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#e2e8f0' }}>2.140 produtos de giro intermediário (Eletroportáteis, Móveis complementares).</p>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b', padding: 12, borderRadius: 10 }}>
                <strong style={{ color: '#fbbf24', fontSize: 13 }}>🟡 Classe C (5% da Receita):</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#e2e8f0' }}>2.661 produtos de baixo giro (Acessórios, itens de cauda longa). Monitorar para evitar capital preso.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
