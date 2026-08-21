import React from 'react';
import KPICard from '../components/KPICard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

export default function Fiscal() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 12 KPIs Tributários */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Saldo do Imposto" value="3,24" suffix=" Mi" highlight="green" />
        <KPICard label="Imposto Entradas" value="9,40" suffix=" Mi" highlight="blue" />
        <KPICard label="Imposto Saídas" value="12,64" suffix=" Mi" highlight="yellow" />
        <KPICard label="Valor ICMS Venda" value="10,14" suffix=" Mi" />
        <KPICard label="Valor PIS Venda" value="210,71" suffix=" Mil" />
        <KPICard label="Valor COFINS Venda" value="972,48" suffix=" Mil" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard label="Carga Tributária" value="21,02" suffix="%" highlight="yellow" />
        <KPICard label="Isentas / Outras" value="7,54" suffix=" Mi" />
        <KPICard label="Vendas NF-e (55)" value="137,63" suffix=" Mi" highlight="cyan" />
        <KPICard label="Vendas NFC-e (65)" value="6,65" suffix=" Mi" highlight="cyan" />
        <KPICard label="IBS Venda (Reforma)" value="4,54" suffix=" Mil" highlight="purple" />
        <KPICard label="CBS Venda (Reforma)" value="40,81" suffix=" Mil" highlight="purple" />
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Impostos Gerados */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            ⚖️ Impostos Gerados (Mi R$)
          </h3>
          <div style={{ width: '100%', height: 220 }}>
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
          </div>
        </div>

        {/* Saídas por Natureza */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
            📤 Impostos por Natureza de Operação (Saídas)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {saidasCFOP.map(s => (
              <div key={s.cfop} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 4 }}>
                <span>{s.cfop}</span>
                <strong style={{ color: s.cor }}>R$ {s.valor.toLocaleString('pt-BR')} Mil</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
