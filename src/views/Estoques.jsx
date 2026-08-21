import React, { useState } from 'react';
import KPICard from '../components/KPICard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const paretoData = [
  { classe: 'A (80%)', itens: '98.034 itens', valor: 83.89, perc: 80, cor: '#ef4444' },
  { classe: 'B (15%)', itens: '27.541 itens', valor: 15.73, perc: 15, cor: '#3b82f6' },
  { classe: 'C (5%)', itens: '20.779 itens', valor: 5.24, perc: 5, cor: '#10b981' },
];

const semVendaData = [
  { faixa: 'Até 30 Dias', qtd: 1311, cor: '#10b981' },
  { faixa: 'Mais de 30 Dias', qtd: 588, cor: '#3b82f6' },
  { faixa: 'Mais de 60 Dias', qtd: 239, cor: '#f59e0b' },
  { faixa: 'Mais de 90 Dias', qtd: 1280, cor: '#00d2ff' },
];

export default function Estoques() {
  const [curvaFiltro, setCurvaFiltro] = useState('Todos');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 8 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Preço de Venda" value="7,26" suffix=" Mi" highlight="cyan" />
        <KPICard label="Preço de Custo" value="3,30" suffix=" Mi" highlight="purple" />
        <KPICard label="Duração Estoque" value="1844" suffix=" Dias" />
        <KPICard label="Média Sem Vendas" value="269,17" suffix=" Dias" highlight="yellow" />
        <KPICard label="Giro de Estoque" value="9922" suffix=" Dias" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Valor da Margem" value="3,96" suffix=" Mi" highlight="green" />
        <KPICard label="% Margem" value="54,61" suffix="%" highlight="green" />
        <KPICard label="% Ruptura Estoque" value="97,17" suffix="%" highlight="red" />
        <KPICard label="Produtos Inativos" value="26" suffix=" Mil" highlight="red" />
        <KPICard label="Produtos Ativos" value="122" suffix=" Mil" highlight="green" />
      </div>

      {/* Curva ABC (Pareto) & Aging Sem Venda */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Curva ABC Pareto */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
              📊 Curva ABC de Produtos (Pareto 80/15/5)
            </h3>
            <select 
              value={curvaFiltro} 
              onChange={(e) => setCurvaFiltro(e.target.value)}
              style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', color: '#fff', padding: '4px 8px', borderRadius: 6, fontSize: '11px' }}
            >
              <option value="Todos">Curva ABC: Todos</option>
              <option value="A">Classe A (80%)</option>
              <option value="B">Classe B (15%)</option>
              <option value="C">Classe C (5%)</option>
            </select>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={paretoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="classe" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ background: 'rgba(14, 25, 44, 0.95)', borderColor: 'rgba(0, 210, 255, 0.4)', borderRadius: 8, color: '#ffffff', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} 
                  itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 600 }}
                  labelStyle={{ color: '#00d2ff', fontWeight: 700 }}
                />
                <Bar dataKey="valor" fill="#00d2ff" radius={[4, 4, 0, 0]}>
                  {paretoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mercadorias Sem Venda */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            ⏳ Mercadorias Sem Venda (Aging de Estoque Parado)
          </h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={semVendaData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
                <YAxis dataKey="faixa" type="category" stroke="var(--text-muted)" fontSize={10} width={100} />
                <Tooltip 
                  contentStyle={{ background: 'rgba(14, 25, 44, 0.95)', borderColor: 'rgba(0, 210, 255, 0.4)', borderRadius: 8, color: '#ffffff', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} 
                  itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 600 }}
                  labelStyle={{ color: '#00d2ff', fontWeight: 700 }}
                />
                <Bar dataKey="qtd" fill="#00d2ff" radius={[0, 4, 4, 0]}>
                  {semVendaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
