import React from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, 
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { Pin, Trash2, TrendingUp, DollarSign, Award, Layers } from 'lucide-react';

const CORES_PALETA = ['#00d2ff', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function DynamicCardRenderer({ widget, onFixar, onRemover, isFixado = false }) {
  if (!widget) return null;

  const { titulo, tipo_widget, config_json, id } = widget;
  const cfg = config_json || {};
  const dados = cfg.dados || [];

  const formatarMoeda = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatarNumero = (val) => {
    return new Intl.NumberFormat('pt-BR').format(val || 0);
  };

  return (
    <div className="bg-[#0b1728] border border-cyan-900/40 rounded-xl p-4 shadow-xl hover:border-cyan-500/50 transition-all flex flex-col justify-between">
      {/* Header do Card */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-950/60 rounded-lg text-cyan-400 border border-cyan-800/40">
            <SparkleIcon tipo={tipo_widget} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">{titulo}</h4>
            <span className="text-[10px] text-slate-400">{cfg.subtitulo || 'Insight Gerado por IA'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onFixar && !isFixado && (
            <button
              onClick={() => onFixar(widget)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 rounded-lg transition-all"
              title="Fixar este card no meu painel principal"
            >
              <Pin size={12} />
              Fixar
            </button>
          )}
          {onRemover && (
            <button
              onClick={() => onRemover(id || widget)}
              className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-all"
              title="Remover card"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo Dinâmico conforme tipo_widget */}
      <div className="my-2 min-h-[150px] flex items-center justify-center">
        {tipo_widget === 'kpi' && (
          <div className="text-center py-4">
            <div className="text-3xl font-extrabold text-cyan-400 tracking-tight">
              {cfg.is_moeda ? formatarMoeda(cfg.valor) : formatarNumero(cfg.valor)}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">{cfg.descricao || 'Métrica Consolidada'}</p>
            {cfg.variacao && (
              <span className={`text-[11px] font-bold mt-2 inline-block px-2 py-0.5 rounded-full ${cfg.variacao >= 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}`}>
                {cfg.variacao >= 0 ? `+${cfg.variacao}%` : `${cfg.variacao}%`} vs período anterior
              </span>
            )}
          </div>
        )}

        {tipo_widget === 'barras' && dados.length > 0 && (
          <div className="w-full h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dados} layout={cfg.horizontal ? 'vertical' : 'horizontal'}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                {cfg.horizontal ? (
                  <>
                    <XAxis type="number" stroke="#64748b" tickFormatter={(v) => cfg.is_moeda ? `R$ ${v/1000}k` : v} />
                    <YAxis type="category" dataKey="label" stroke="#94a3b8" width={90} tick={{ fontSize: 10 }} />
                  </>
                ) : (
                  <>
                    <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tickFormatter={(v) => cfg.is_moeda ? `R$ ${v/1000}k` : v} />
                  </>
                )}
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#00d2ff', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value) => [cfg.is_moeda ? formatarMoeda(value) : formatarNumero(value), cfg.metrica_label || 'Total']}
                />
                <Bar dataKey="valor" fill="#00d2ff" radius={[4, 4, 0, 0]}>
                  {dados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tipo_widget === 'linhas' && dados.length > 0 && (
          <div className="w-full h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dados}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tickFormatter={(v) => cfg.is_moeda ? `R$ ${v/1000}k` : v} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#00d2ff', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value) => [cfg.is_moeda ? formatarMoeda(value) : formatarNumero(value), cfg.metrica_label || 'Evolução']}
                />
                <Line type="monotone" dataKey="valor" stroke="#00d2ff" strokeWidth={3} dot={{ r: 3, fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {tipo_widget === 'pizza' && dados.length > 0 && (
          <div className="w-full h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dados} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={4} dataKey="valor">
                  {dados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#00d2ff', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value) => [cfg.is_moeda ? formatarMoeda(value) : formatarNumero(value), 'Participação']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {tipo_widget === 'ranking' && dados.length > 0 && (
          <div className="w-full">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 pb-1">
                  <th className="pb-1">#</th>
                  <th className="pb-1">Item / Dimensão</th>
                  <th className="pb-1 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {dados.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-1.5 font-bold text-cyan-400">{idx + 1}º</td>
                    <td className="py-1.5 font-medium text-slate-200 truncate max-w-[140px]">{row.label}</td>
                    <td className="py-1.5 text-right font-bold text-slate-100">{cfg.is_moeda ? formatarMoeda(row.valor) : formatarNumero(row.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer com Explicação Semântica */}
      {cfg.explicacao_ia && (
        <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 italic">
          💡 {cfg.explicacao_ia}
        </div>
      )}
    </div>
  );
}

function SparkleIcon({ tipo }) {
  if (tipo === 'kpi') return <DollarSign size={14} />;
  if (tipo === 'ranking') return <Award size={14} />;
  if (tipo === 'linhas') return <TrendingUp size={14} />;
  return <Layers size={14} />;
}
