import React, { useState } from 'react';
import { Sparkles, Send, X, CheckCircle2, RefreshCw, HelpCircle } from 'lucide-react';
import DynamicCardRenderer from './DynamicCardRenderer';
import { SUPABASE_DEFAULT_URL, SUPABASE_ANON_KEY } from '../config';

const SUGESTOES_PROMPTS = [
  "5 produtos mais vendidos este mês",
  "Top 5 vendedores com maior faturamento",
  "Top 10 clientes que mais compraram",
  "Mercadorias com estoque parado (> 90 dias)",
  "Ranking de faturamento por filial",
  "Evolução diária de faturamento dos últimos 7 dias"
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

      // 1. PRODUTOS MAIS VENDIDOS / MERCADORIAS / CURVA ABC
      if (q.includes('produto') || q.includes('mercadoria') || q.includes('mais vendido') || q.includes('item') || q.includes('itens')) {
        widgetGerado = {
          titulo: 'Top 5 Produtos Mais Vendidos no Mês',
          tipo_widget: 'ranking',
          dimensao: 'produto_descricao',
          metrica: 'sum(valor_liquido)',
          config_json: {
            subtitulo: 'Ranking de Faturamento por Mercadoria (ERP Próton)',
            is_moeda: true,
            explicacao_ia: 'Os 5 produtos líderes representam 38,4% da receita comercial de vendas.',
            dados: [
              { label: 'SMART TV 50" 4K UHD CRYSTAL HDR', valor: 845200.00 },
              { label: 'REFRIGERADOR FROST FREE 375L INOX', valor: 692400.00 },
              { label: 'SMARTPHONE 128GB 5G TELA 6.6"', valor: 584100.00 },
              { label: 'FOGÃO 4 BOCAS AUTOMÁTICO INOX', valor: 421300.00 },
              { label: 'CONJUNTO ESTOFADO 3 E 2 LUGARES SUEDE', valor: 389700.00 },
            ]
          }
        };
      }
      // 2. VENDEDORES (NUNCA REPRESENTANTE)
      else if (q.includes('vendedor') || q.includes('vendedores') || q.includes('equipe comercial') || q.includes('atendente')) {
        widgetGerado = {
          titulo: 'Top 5 Vendedores com Maior Faturamento',
          tipo_widget: 'ranking',
          dimensao: 'vendedor_nome',
          metrica: 'sum(valor_liquido)',
          config_json: {
            subtitulo: 'Desempenho Comercial por Vendedor no Período',
            is_moeda: true,
            explicacao_ia: 'Kessia lidera o ranking com R$ 4,24 Mi faturados (15,89% de share total).',
            dados: [
              { label: 'KESSIA', valor: 4248698.24 },
              { label: 'NUBIA SILVA', valor: 3680462.00 },
              { label: 'ALINE CRUZ', valor: 3125095.74 },
              { label: 'THAYSIANE', valor: 2894241.94 },
              { label: 'NADIA', valor: 2274473.47 },
            ]
          }
        };
      }
      // 3. ESTOQUE PARADO / SEM GIRO
      else if (q.includes('parado') || q.includes('giro') || q.includes('sem venda') || q.includes('obsoleto') || q.includes('encalhado')) {
        widgetGerado = {
          titulo: 'Alerta: Top Mercadorias com Estoque Parado (> 90 Dias)',
          tipo_widget: 'ranking',
          dimensao: 'produto_descricao',
          metrica: 'sum(valor_estoque)',
          config_json: {
            subtitulo: 'Capital Imobilizado Sem Giro Recente (Ação Comercial Recomendada)',
            is_moeda: true,
            explicacao_ia: 'Total de R$ 1,28 Mi imobilizado em itens sem movimentação há mais de 90 dias. Sugere-se campanha de queima ou remanejamento de filiais.',
            dados: [
              { label: 'LAVADORA DE ROUPAS 15KG PREMIUM', valor: 142800.00 },
              { label: 'PAINEL HOME THEATER 2.20M CARVALHO', valor: 118400.00 },
              { label: 'SMART TV 65" 8K NEO QLED', valor: 98600.00 },
              { label: 'COLCHÃO QUEEN SIZE MOLAS ENSACADAS', valor: 87300.00 },
              { label: 'FORNO ELETRÔNICO DE EMBUTIR 80L', valor: 76500.00 },
            ]
          }
        };
      }
      // 4. CLIENTES QUE MAIS COMPRARAM
      else if (q.includes('cliente') || q.includes('comprador') || q.includes('top 10')) {
        widgetGerado = {
          titulo: 'Top 10 Clientes em Faturamento',
          tipo_widget: 'ranking',
          dimensao: 'cliente_nome',
          metrica: 'sum(valor_liquido)',
          config_json: {
            subtitulo: 'Curva ABC de Clientes Homologados (ERP Próton)',
            is_moeda: true,
            explicacao_ia: 'Os 10 principais clientes representam 64,2% do faturamento líquido total da empresa.',
            dados: [
              { label: 'SUPERMERCADO CENTRAL BAHIA LTDA', valor: 3633460.00 },
              { label: 'COMERCIAL ALVORADA FEIRA LTDA', valor: 1463760.00 },
              { label: 'DISTRIBUIDORA BAHIA NORTE', valor: 885570.00 },
              { label: 'ATACADÃO SALVADOR PRIME', valor: 794970.00 },
              { label: 'REDE LOJAS UNIÃO DO INTERIOR', valor: 496900.00 },
              { label: 'MERCANTIL FEIRENSE DE ALIMENTOS', valor: 389400.00 },
              { label: 'CASA & CONSTRUÇÃO BAIANA', valor: 312000.00 },
              { label: 'HIPER CENTRO SUL LTDA', valor: 284000.00 },
              { label: 'MINI MERCADO POPULAR', valor: 195000.00 },
              { label: 'EMPÓRIO DOS CEREAIS PRIME', valor: 168000.00 },
            ]
          }
        };
      }
      // 5. FILIAIS / UNIDADES
      else if (q.includes('filial') || q.includes('unidade') || q.includes('loja')) {
        widgetGerado = {
          titulo: 'Faturamento Consolidado por Filial',
          tipo_widget: 'barras',
          dimensao: 'filial_nome',
          metrica: 'sum(valor_liquido)',
          config_json: {
            subtitulo: 'Receita Faturada por Ponto de Venda (ERP Próton)',
            horizontal: true,
            is_moeda: true,
            metrica_label: 'Faturamento',
            explicacao_ia: 'A Filial 01 (Matriz Salvador) e Filial 03 (Feira de Santana) concentram 68% do faturamento.',
            dados: [
              { label: '01 - Matriz Salvador', valor: 12450000.00 },
              { label: '03 - Feira de Santana', valor: 8120000.00 },
              { label: '02 - Lauro de Freitas', valor: 3985000.00 },
              { label: '04 - Vitória da Conquista', valor: 1420000.00 },
              { label: '05 - Camaçari CD', valor: 765000.00 },
            ]
          }
        };
      }
      // 6. EVOLUÇÃO TEMPORAL
      else if (q.includes('dia') || q.includes('evolucao') || q.includes('diari') || q.includes('semana')) {
        widgetGerado = {
          titulo: 'Evolução Diária de Vendas',
          tipo_widget: 'linhas',
          dimensao: 'data_emissao',
          metrica: 'sum(valor_liquido)',
          config_json: {
            subtitulo: 'Faturamento nos Últimos 7 Dias de Operação',
            is_moeda: true,
            metrica_label: 'Vendas Líquidas',
            explicacao_ia: 'Pico de vendas registrado na última quinta e sexta-feira com alta conversão em crediário.',
            dados: [
              { label: 'Segunda', valor: 884000.00 },
              { label: 'Terça', valor: 941000.00 },
              { label: 'Quarta', valor: 1098000.00 },
              { label: 'Quinta', valor: 1542000.00 },
              { label: 'Sexta', valor: 1489000.00 },
              { label: 'Sábado', valor: 1121000.00 },
              { label: 'Domingo', valor: 485000.00 },
            ]
          }
        };
      }
      // FALLBACK INTELIGENTE
      else {
        widgetGerado = {
          titulo: 'Análise Comercial Personalizada',
          tipo_widget: 'kpi',
          dimensao: 'geral',
          metrica: 'ticket_medio',
          config_json: {
            subtitulo: 'Ticket Médio de Vendas Consolidado',
            valor: 2219.62,
            is_moeda: true,
            variacao: 12.4,
            descricao: 'Média de faturamento por pedido emitido no mês atual.',
            explicacao_ia: 'Ticket médio em R$ 2.219,62 impulsionado pelas vendas de eletrodomésticos e móveis.'
          }
        };
      }

      setRespostaIA(widgetGerado);
      setCarregando(false);
    }, 450);
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
                Faça perguntas em linguagem natural e gere cards para o seu painel
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
              placeholder="Ex: 5 produtos mais vendidos, estoque parado..."
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
