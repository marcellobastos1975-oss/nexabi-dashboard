import { SUPABASE_DEFAULT_URL, SUPABASE_ANON_KEY } from '../config';

const metricsCache = new Map();

export function clearMetricsCache() {
  metricsCache.clear();
}

export async function fetchCompanyMetrics(
  empresaId = null, 
  periodoPreset = 'mes_atual', 
  unidade = 'Todas',
  dataInicio = null,
  dataFim = null,
  forceRefresh = false
) {
  const cacheKey = `${empresaId || 'todas'}_${periodoPreset || 'mes_atual'}_${unidade || 'Todas'}_${dataInicio || ''}_${dataFim || ''}`;

  // Se já tiver em cache na sessão atual e não for refresh forçado, retorna imediatamente
  if (!forceRefresh && metricsCache.has(cacheKey)) {
    return metricsCache.get(cacheKey);
  }

  try {
    const payload = {
      p_empresa_id: empresaId || 'todas',
      p_periodo: periodoPreset || 'mes_atual',
      p_filial: unidade || 'Todas'
    };

    if (periodoPreset === 'custom' && dataInicio && dataFim) {
      payload.p_dt_inicio = dataInicio;
      payload.p_dt_fim = dataFim;
    }

    const res = await fetch(`${SUPABASE_DEFAULT_URL}/rest/v1/rpc/get_dashboard_metrics`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        metricsCache.set(cacheKey, data);
        return data;
      }
    }
  } catch (err) {
    console.warn('Falha ao consultar get_dashboard_metrics no Supabase:', err);
  }

  // Fallback caso ocorra falha de rede
  const emptyFallback = {
    hasData: false,
    vendaBruta: '0,00',
    vendaLiquida: '0,00',
    qtdVendas: '0,00',
    ticketMedio: 'R$ 0,00',
    clientesCompraram: '0,00',
    vendaBrutaDia: '0,00',
    valorCR: '0,00',
    crVencido: '0,00',
    inadimplencia: '0,00',
    crAVencer: '0,00',
    percInadimplencia: '0,00',
    percInadimplenciaNum: 0,
    jurosRecebidos: '0,00',
    crVista: '0,00',
    cr30d: '0,00',
    cr60d: '0,00',
    cr90d: '0,00',
    crPrazoMedio: '0',
    valorCP: '0,00',
    cpVencido: '0,00',
    aPagarEmAtraso: '0,00',
    cpAVencer: '0,00',
    cpPagoPeriodo: '0,00',
    cpVista: '0,00',
    cp30d: '0,00',
    cp60d: '0,00',
    cp90d: '0,00',
    cpPrazoMedio: '0',
    valorCRMenosCP: 'R$ 0,00',
    valorEstoque: '0,00',
    valorEstoqueVenda: '0,00',
    estoqueParado90d: '0,00',
    produtosEmLinha: '0',
    estoqueItensSemGiro: '0',
    estoqueGiroAnual: '0,0',
    estoqueDuracaoDias: '0',
    estoqueMargemPerc: '0,00',
    contasFinanc: '0,00',
    vlrNegativoContas: '0,00',
    saldoTotalContas: '0,00',
    saldoTotalContasNum: 0,
    liquidezGeral: '0,00',
    liquidezGeralNum: 0,
    margemBruta: '0,00',
    percMargem: '0,00',
    impostosDiretos: '0,00',
    percImpostosDiretos: '0,00',
    cmv: '0,00',
    percCMV: '0,00',
    margemContribuicao: '0,00',
    percMargemContribuicao: '0,00',
    metaVenda: '0,00',
    metaAtingida: '0,00',
    percVendaLiquida: '0,00',
    historico12m: [],
    topVendedores: [],
    topClientes: [],
    topCredores: [],
    formasPagamento: [],
    curvaABC: [],
    topProdutos: []
  };
  return emptyFallback;
}
