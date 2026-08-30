import React, { useState } from 'react';
import { Sparkles, Send, X, Pin, CheckCircle2, RefreshCw, HelpCircle, Layers, TrendingUp } from 'lucide-react';
import DynamicCardRenderer from './DynamicCardRenderer';
import { SUPABASE_DEFAULT_URL, SUPABASE_ANON_KEY } from '../config';

const SUGESTOES_PROMPTS = [
  "Top 10 Clientes que mais compraram este mês",
  "Ranking de Vendas por Filial / Unidade",
  "Evolução Diária de Faturamento dos últimos 7 dias",
  "Participação das Categorias de Status de Pedidos",
  "Top 5 Vendedores com maior faturamento"
];

export default function AIAssistantDrawer({ isOpen, onClose, empresaId = '30820528000178', onWidgetFixado }) {
  const [prompt, setPrompt] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [respostaIA, setRespostaIA] = useState(null);
  const [fixadoSucesso, setFixadoSucesso] = useState(false);

  if (!isOpen) return null;

  const processarPerguntaIA = (textoPergunta) => {
    const q = (textoPergunta || prompt).toLowerCase().trim();
    if (!q) return;

    setCarregando(true);
    setRespostaIA(null);
    setFixadoSucesso(false);

    setTimeout(() => {
      let widgetGerado = null;

      if (q.includes('cliente') || q.includes('compraram') || q.includes('top 10')) {
        widgetGerado = {
          titulo: 'Top 10 Clientes em Faturamento',
          tipo_widget: 'ranking',
          dimensao: 'cliente_nome',
          metrica: 'sum(valor_liquido)',
          config_json: {
            subtitulo: 'Curva ABC de Clientes (Mês Atual - Próton)',
            is_moeda: true,
            explicacao_ia: 'Os 10 principais clientes representam 64% do faturamento líquido total.',
            dados: [
              { label: 'Supermercado Central Ltda', valor: 84250.00 },
              { label: 'Comercial Alvorada Bahia', valor: 62100.50 },
              { label: 'Atacadão Salvador Prime', valor: 58900.00 },
              { label: 'Distribuidora Feirense', valor: 45320.00 },
              { label: 'Mercantil Bahia Norte', valor: 39800.00 },
              { label: 'Rede Lojas União', valor: 31200.00 },
              { label: 'Hiper Centro Sul', valor: 28400.00 },
              { label: 'Casa & Construção Baiana', valor: 24600.00 },
              { label: 'Mini Mercado Popular', valor: 19500.00 },
              { label: 'Empório dos Cereais', valor: 16800.00 },
            ]
          }
        };
      } else if (q.includes('filial') || q.includes('unidade')) {
        widgetGerado = {
          titulo: 'Faturamento por Filial',
          tipo_widget: 'barras',
          dimensao: 'filial_nome',
          metrica: 'sum(valor_liquido)',
          config_json: {
            subtitulo: 'Desempenho por Ponto de Venda',
            horizontal: true,
            is_moeda: true,
            metrica_label: 'Faturamento',
            explicacao_ia: 'A Filial 01 (Matriz) e Filial 03 lideram a receita consolidada do grupo.',
            dados: [
              { label: '01 - Matriz Centro', valor: 145000.00 },
              { label: '03 - Feira de Santana', valor: 112000.00 },
              { label: '02 - Lauro de Freitas', valor: 98500.00 },
              { label: '04 - Vitória da Conquista', valor: 76000.00 },
              { label: '05 - Camaçari CD', valor: 64200.00 },
            ]
          }
        };
      } else if (q.includes('dia') || q.includes('evolucao') || q.includes('diari')) {
        widgetGerado = {
          titulo: 'Evolução Diária de Vendas',
          tipo_widget: 'linhas',
          dimensao: 'data_emissao',
          metrica: 'sum(valor_liquido)',
          config_json: {
            subtitulo: 'Últimos 7 Dias de Operação',
            is_moeda: true,
            metrica_label: 'Vendas Líquidas',
            explicacao_ia: 'Pico de vendas registrado na última quinta-feira com forte conversão.',
            dados: [
              { label: 'Segunda', valor: 28400.00 },
              { label: 'Terça', valor: 34100.00 },
              { label: 'Quarta', valor: 39800.00 },
              { label: 'Quinta', valor: 54200.00 },
              { label: 'Sexta', valor: 48900.00 },
              { label: 'Sábado', valor: 42100.00 },
              { label: 'Domingo', valor: 18500.00 },
            ]
          }
        };
      } else if (q.includes('vendedor') || q.includes('representante')) {
        widgetGerado = {
          titulo: 'Top Vendedores do Mês',
          tipo_widget: 'barras',
          dimensao: 'vendedor_nome',
          metrica: 'sum(valor_liquido)',
          config_json: {
            subtitulo: 'Ranking de Vendas por Representante',
            horizontal: false,
            is_moeda: true,
            metrica_label: 'Total Vendido',
            explicacao_ia: 'Carlos Eduardo atingiu 128% da meta mensal estipulada.',
            dados: [
              { label: 'Carlos Eduardo', valor: 89400.00 },
              { label: 'Mariana Santos', valor: 76200.00 },
              { label: 'Roberto Silva', valor: 68100.00 },
              { label: 'Fernanda Lima', valor: 54900.00 },
              { label: 'Lucas Andrade', valor: 42300.00 },
            ]
          }
        };
      } else {
        widgetGerado = {
          titulo: 'Métrica Personalizada de Vendas',
          tipo_widget: 'kpi',
          dimensao: 'geral',
          metrica: 'ticket_medio',
          config_json: {
            subtitulo: 'Ticket Médio de Venda Consolidado',
            valor: 1845.60,
            is_moeda: true,
            variacao: 8.4,
            descricao: 'Valor médio por pedido faturado no período selecionado.',
            explicacao_ia: 'Ticket médio com alta de 8.4% impulsionado pela venda de itens de maior valor agregado.'
          }
        };
      }

      setRespostaIA(widgetGerado);
      setCarregando(false);
    }, 500);
  };

  const fixarNoPainel = async (w) => {
    try {
      const url = `${SUPABASE_DEFAULT_URL}/rest/v1/bi_user_custom_widgets`;
      const payload = [{
        empresa_cnpj: empresaId || '30820528000178',
        titulo: w.titulo,
        tipo_widget: w.tipo_widget,
        dimensao: w.dimensao || 'geral',
        metrica: w.metrica || 'total',
        config_json: w.config_json
      }];

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        setFixadoSucesso(true);
        if (onWidgetFixado) onWidgetFixado(w);
      }
    } catch (err) {
      console.error("Erro ao fixar widget:", err);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 99999
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '560px',
          height: '100%',
          background: 'linear-gradient(180deg, #0b1728 0%, #070d18 100%)',
          borderLeft: '1px solid rgba(0, 210, 255, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.8)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Drawer */}
        <div style={{ padding: '16px 20px', background: '#08111e', borderBottom: '1px solid rgba(0, 210, 255, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'linear-gradient(135deg, #7928ca 0%, #00d2ff 100%)', padding: 8, borderRadius: 10, color: '#fff' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                Assistente IA de Negócios (Generative BI)
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#38bdf8' }}>
                Faça perguntas em linguagem natural e crie cards para o seu painel
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Sugestões Rápidas */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <HelpCircle size={14} color="#00d2ff" /> Sugestões de Perguntas Rápidas:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUGESTOES_PROMPTS.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => { setPrompt(sug); processarPerguntaIA(sug); }}
                  style={{
                    fontSize: '11px',
                    padding: '6px 12px',
                    borderRadius: 20,
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: '#cbd5e1',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00d2ff'; e.currentTarget.style.color = '#00d2ff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#cbd5e1'; }}
                >
                  ⚡ {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Área de Resposta da IA */}
          {carregando && (
            <div style={{ padding: 32, textAlign: 'center', background: 'rgba(11, 23, 40, 0.6)', borderRadius: 12, border: '1px solid rgba(0, 210, 255, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <RefreshCw className="spin" size={26} color="#00d2ff" />
              <p style={{ margin: 0, fontSize: '13px', color: '#e2e8f0', fontWeight: 600 }}>
                Consultando o Catálogo Semântico e gerando seu card analítico...
              </p>
            </div>
          )}

          {respostaIA && !carregando && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>
                  Card Analítico Gerado pela IA com Sucesso:
                </span>
              </div>

              {/* Card Dinâmico Renderizado */}
              <DynamicCardRenderer 
                widget={respostaIA} 
                onFixar={fixarNoPainel}
                isFixado={fixadoSucesso}
              />

              {fixadoSucesso && (
                <div style={{ padding: 12, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: 10, fontSize: '12px', color: '#6ee7b7', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={18} />
                  Card fixado com sucesso no seu Panorama Geral!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Bar Inferior */}
        <div style={{ padding: '16px 20px', background: '#08111e', borderTop: '1px solid rgba(0, 210, 255, 0.25)' }}>
          <form onSubmit={(e) => { e.preventDefault(); processarPerguntaIA(); }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Top 10 clientes que mais compraram este mês..."
              style={{
                flex: 1,
                background: '#16253b',
                border: '1px solid rgba(0, 210, 255, 0.3)',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: '13px',
                color: '#fff',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={carregando || !prompt.trim()}
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #7928ca 0%, #00d2ff 100%)',
                border: 'none',
                color: '#fff',
                borderRadius: 10,
                fontWeight: 700,
                cursor: 'pointer',
                opacity: (carregando || !prompt.trim()) ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
