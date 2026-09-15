import { SUPABASE_DEFAULT_URL, SUPABASE_ANON_KEY } from '../config';

const STORAGE_PREFIX = 'nexabi_metrics_v2_';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos (sincronizado com bi_dashboard_cache)
const metricsCache = new Map();

export function getMetricsCacheKey(empresaId, periodoPreset, unidade, dataInicio, dataFim) {
  const isCustom = periodoPreset === 'custom';
  return `${empresaId || 'todas'}_${periodoPreset || 'mes_atual'}_${unidade || 'Todas'}_${isCustom ? (dataInicio || '') : ''}_${isCustom ? (dataFim || '') : ''}`;
}

export function clearMetricsCache() {
  metricsCache.clear();
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Erro ao limpar cache local:', e);
  }
}

/**
 * Retorna dados em cache de forma síncrona (0ms) para renderização imediata.
 * Verifica a memória RAM primeiro, e em seguida o localStorage.
 */
export function getCachedCompanyMetrics(
  empresaId = null, 
  periodoPreset = 'mes_atual', 
  unidade = 'Todas',
  dataInicio = null,
  dataFim = null
) {
  const cacheKey = getMetricsCacheKey(empresaId, periodoPreset, unidade, dataInicio, dataFim);
  
  if (metricsCache.has(cacheKey)) {
    return metricsCache.get(cacheKey);
  }

  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + cacheKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.data) {
        metricsCache.set(cacheKey, parsed.data);
        return parsed.data;
      }
    }
  } catch (e) {
    // Falha silenciosa no acesso ao localStorage
  }

  return null;
}

export async function fetchCompanyMetrics(
  empresaId = null, 
  periodoPreset = 'mes_atual', 
  unidade = 'Todas',
  dataInicio = null,
  dataFim = null,
  forceRefresh = false
) {
  const cacheKey = getMetricsCacheKey(empresaId, periodoPreset, unidade, dataInicio, dataFim);
  const now = Date.now();

  // 1. Se já estiver em cache na sessão atual (RAM) e não for refresh forçado, retorna imediatamente
  if (!forceRefresh && metricsCache.has(cacheKey)) {
    return metricsCache.get(cacheKey);
  }

  // 2. Verificar cache persistente no localStorage
  let cachedEntry = null;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + cacheKey);
    if (raw) {
      cachedEntry = JSON.parse(raw);
      if (cachedEntry && cachedEntry.data) {
        metricsCache.set(cacheKey, cachedEntry.data);
        // Se ainda for recente (< 15 min) e não for refresh manual forçado, retorna de imediato
        if (!forceRefresh && (now - cachedEntry.timestamp < CACHE_TTL_MS)) {
          return cachedEntry.data;
        }
      }
    }
  } catch (e) {}

  // 3. Consulta ao Supabase (com leitura direta da bi_dashboard_cache em ~100ms e RPC SWR)
  const targetEmpresa = empresaId || 'todas';
  const targetPeriodo = periodoPreset || 'mes_atual';
  const targetUnidade = unidade || 'Todas';

  // 3.1 Consulta prioritária e ultra-rápida à tabela bi_dashboard_cache (quando não for período personalizado)
  if (!forceRefresh && periodoPreset !== 'custom') {
    try {
      const cacheUrl = `${SUPABASE_DEFAULT_URL}/rest/v1/bi_dashboard_cache?empresa_id=eq.${encodeURIComponent(targetEmpresa)}&periodo=eq.${encodeURIComponent(targetPeriodo)}&filial=eq.${encodeURIComponent(targetUnidade)}&select=metricas,atualizado_em`;
      const ctrlFast = new AbortController();
      const tidFast = setTimeout(() => ctrlFast.abort(), 4000);

      const cacheRes = await fetch(cacheUrl, {
        signal: ctrlFast.signal,
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      clearTimeout(tidFast);

      if (cacheRes.ok) {
        const rows = await cacheRes.json();
        if (rows && rows.length > 0 && rows[0].metricas && rows[0].metricas.hasData) {
          const cachedData = rows[0].metricas;
          metricsCache.set(cacheKey, cachedData);
          try {
            localStorage.setItem(STORAGE_PREFIX + cacheKey, JSON.stringify({
              timestamp: Date.now(),
              data: cachedData
            }));
          } catch (e) {}
          return cachedData;
        }
      }
    } catch (cacheErr) {
      console.warn('Consulta rápida a bi_dashboard_cache:', cacheErr);
    }
  }

  // 3.2 Chamada da RPC get_dashboard_metrics (com proteção de timeout AbortController de 30 segundos)
  try {
    const payload = {
      p_empresa_id: targetEmpresa,
      p_periodo: targetPeriodo,
      p_filial: targetUnidade
    };

    if (periodoPreset === 'custom' && dataInicio && dataFim) {
      payload.p_dt_inicio = dataInicio;
      payload.p_dt_fim = dataFim;
    }

    const ctrlRPC = new AbortController();
    const tidRPC = setTimeout(() => ctrlRPC.abort(), 30000);

    const res = await fetch(`${SUPABASE_DEFAULT_URL}/rest/v1/rpc/get_dashboard_metrics`, {
      method: 'POST',
      signal: ctrlRPC.signal,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    clearTimeout(tidRPC);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        metricsCache.set(cacheKey, data);
        try {
          localStorage.setItem(STORAGE_PREFIX + cacheKey, JSON.stringify({
            timestamp: Date.now(),
            data: data
          }));
        } catch (e) {}
        return data;
      }
    }
  } catch (err) {
    console.warn('Falha ao consultar get_dashboard_metrics no Supabase:', err);
  }

  // 4. Se a rede oscilar ou falhar, preserva dados anteriores em cache ao invés de zerar a tela
  if (cachedEntry && cachedEntry.data) {
    return cachedEntry.data;
  }

  // Fallback caso ocorra falha de rede ou timeout
  const emptyFallback = {
    hasData: false,
    isNetworkError: true,
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
    estoqueItensNegativos: '0',
    valorEstoqueNegativo: '0,00',
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
    qtdPedidosAbertos: '0',
    valorPedidosAbertos: '0,00',
    qtdPedidosCancelados: '0',
    valorPedidosCancelados: '0,00',
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
