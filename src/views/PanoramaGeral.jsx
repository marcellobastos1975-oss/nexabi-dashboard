import React from 'react';
import KPICard from '../components/KPICard';
import LiquidityGauge from '../components/LiquidityGauge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Treemap, Cell 
} from 'recharts';

const historicoVendas12m = [
  { mes: '2025-jul', valor: 1391.91 },
  { mes: '2025-ago', valor: 1445.22 },
  { mes: '2025-set', valor: 1376.07 },
  { mes: '2025-out', valor: 1295.47 },
  { mes: '2025-nov', valor: 1501.05 },
  { mes: '2025-dez', valor: 2312.07 },
  { mes: '2026-jan', valor: 1311.28 },
  { mes: '2026-fev', valor: 1109.78 },
  { mes: '2026-mar', valor: 1251.26 },
  { mes: '2026-abr', valor: 1118.94 },
  { mes: '2026-mai', valor: 1566.68 },
  { mes: '2026-jun', valor: 1680.40 },
];

const treemapData = [
  { name: 'Venda Bruta', size: 94.14, fill: '#059669' },
  { name: 'Valor CR', size: 17.37, fill: '#d97706' },
  { name: 'Vr Estoque', size: 7.26, fill: '#2563eb' },
  { name: 'Valor CP', size: 6.77, fill: '#dc2626' },
  { name: 'Vr Contas', size: 6.26, fill: '#0891b2' }
];

const CustomTreemapContent = (props) => {
  const { x, y, width, height, name, size, fill } = props;
  if (!width || !height || width < 20 || height < 20) return null;

  const words = (name || '').split(' ');
  const isNarrow = width < 85;
  const vlrFmt = `R$ ${Number(size).toFixed(2).replace('.', ',')} Mi`;

  return (
    <g>
      <rect
        x={x + 1}
        y={y + 1}
        width={width - 2}
        height={height - 2}
        style={{
          fill: fill || '#059669',
          stroke: '#070d18',
          strokeWidth: 2,
          rx: 6,
          ry: 6,
        }}
      />
      
      {/* Caso Bloco Estreito (ex: Vr Estoque, Vr Contas) */}
      {isNarrow ? (
        <g stroke="none" fill="#ffffff" style={{ pointerEvents: 'none' }}>
          {height >= 55 ? (
            <>
              <text
                x={x + width / 2}
                y={y + height / 2 - 14}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                stroke="none"
                strokeWidth={0}
                fontSize={11}
                fontWeight="600"
                fontFamily="Inter, sans-serif"
              >
                {words[0]}
              </text>
              {words.length > 1 && (
                <text
                  x={x + width / 2}
                  y={y + height / 2 - 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#ffffff"
                  stroke="none"
                  strokeWidth={0}
                  fontSize={11}
                  fontWeight="600"
                  fontFamily="Inter, sans-serif"
                >
                  {words.slice(1).join(' ')}
                </text>
              )}
              <text
                x={x + width / 2}
                y={y + height / 2 + 15}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                stroke="none"
                strokeWidth={0}
                fontSize={10}
                fontWeight="700"
                fontFamily="Inter, sans-serif"
              >
                {vlrFmt}
              </text>
            </>
          ) : (
            <text
              x={x + width / 2}
              y={y + height / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ffffff"
              stroke="none"
              strokeWidth={0}
              fontSize={10}
              fontWeight="700"
              fontFamily="Inter, sans-serif"
            >
              {name}
            </text>
          )}
        </g>
      ) : (
        /* Bloco Amplo (ex: Venda Bruta, Valor CR) */
        <g stroke="none" fill="#ffffff" style={{ pointerEvents: 'none' }}>
          <text
            x={x + width / 2}
            y={y + height / 2 - (height > 50 ? 11 : 0)}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#ffffff"
            stroke="none"
            strokeWidth={0}
            fontSize={width > 160 ? 16 : 13}
            fontWeight="600"
            fontFamily="Inter, sans-serif"
          >
            {name}
          </text>
          {height > 50 && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 13}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ffffff"
              stroke="none"
              strokeWidth={0}
              fontSize={width > 160 ? 14 : 12}
              fontWeight="700"
              fontFamily="Inter, sans-serif"
            >
              {vlrFmt}
            </text>
          )}
        </g>
      )}
    </g>
  );
};

export default function PanoramaGeral() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Grade Superior de 14 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <KPICard label="Venda Bruta" value="94,14" suffix=" Mi" highlight="cyan" />
        <KPICard label="Valor Estoque" value="7,26" suffix=" Mi" highlight="purple" />
        <KPICard label="Valor CR" value="17,37" suffix=" Mi" highlight="yellow" />
        <KPICard label="Valor CP" value="6,77" suffix=" Mi" highlight="blue" />
        <KPICard label="Contas Financ." value="38,96" suffix=" Mi" highlight="cyan" />
        <KPICard label="Margem Bruta" value="3,96" suffix=" Mi" highlight="green" />
        <KPICard label="Inadimplência" value="9,62" suffix=" Mi" highlight="red" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <KPICard label="Qtd. Vendas" value="122,66" suffix=" Mil" />
        <KPICard label="Clientes Compraram" value="31" suffix=" Mil" />
        <KPICard label="Juros Recebidos" value="2,93" suffix=" Mi" highlight="green" />
        <KPICard label="A Pagar em Atraso" value="160,38" suffix=" Mil" highlight="red" />
        <KPICard label="Vlr Negativo C. Fin" value="-32,70" suffix=" Mi" highlight="red" />
        <KPICard label="% Margem" value="54,61" suffix="%" highlight="green" />
        <KPICard label="% Inadimplência" value="71,39" suffix="%" highlight="red" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <KPICard label="Venda Bruta do Dia" value="17,75" suffix=" Mil" highlight="cyan" />
        <KPICard label="Ticket Médio" value="R$ 3,64" suffix=" Mil" />
        <KPICard label="Valor CR - CP" value="R$ 10,60" suffix=" Mi" highlight="green" />
      </div>

      {/* 2. Seção Central: Gauges de Liquidez + Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <LiquidityGauge title="Saldo Total das Contas" value={6.26} color="#7928ca" max={20} />
          <LiquidityGauge title="(Est. + CR + Ctas) - CP" value={20.26} color="#10b981" max={30} />
        </div>

        {/* Treemap com Alto Contraste e Quebra Inteligente */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            📊 Proporção de Capital &amp; Operação (Treemap)
          </h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <Treemap
                data={treemapData}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="#070d18"
                content={<CustomTreemapContent />}
              />
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Gráfico Histórico 12 Meses */}
      <div className="glass-card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 12 }}>
          📈 Vendas nos Últimos 12 Meses (Mil R$)
        </h3>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={historicoVendas12m} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
              <YAxis dataKey="mes" type="category" stroke="var(--text-muted)" fontSize={11} width={80} />
              <Tooltip 
                contentStyle={{ background: 'rgba(14, 25, 44, 0.95)', borderColor: 'rgba(0, 210, 255, 0.4)', borderRadius: 8, color: '#ffffff', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 600 }}
                labelStyle={{ color: '#00d2ff', fontWeight: 700 }}
                formatter={(val) => [`R$ ${val.toLocaleString('pt-BR')} Mil`, 'Faturamento']}
              />
              <Bar dataKey="valor" fill="#00d2ff" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
