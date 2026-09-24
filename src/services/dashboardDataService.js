import { SUPABASE_DEFAULT_URL, SUPABASE_ANON_KEY, APP_VERSION } from '../config';
import baselineEntries from './baselineCache.json';

const STORAGE_PREFIX = 'nexabi_metrics_' + APP_VERSION.replace(/[^a-zA-Z0-9]/g, '_') + '_';
const metricsCache = new Map();
const inFlightRequests = new Map();

// =============================================================================
// BASELINE AUDITADO EMBARCADO (Renderização instantânea em 0ms à prova de falhas)
// =============================================================================
const baselineMap = new Map();
if (Array.isArray(baselineEntries)) {
  baselineEntries.forEach(entry => {
    if (!entry || !entry.metricas) return;
    const baseKey = entry.empresa_id + '_' + entry.periodo + '_' + entry.filial;
    baselineMap.set(baseKey, entry.metricas);
    // Mapeamento de CNPJs conhecidos para o UUID correspondente
    if (entry.empresa_id === '433f17e6-6eba-4de1-b8d0-9715d34089f3') {
      baselineMap.set('30.820.528/0001-78_' + entry.periodo + '_' + entry.filial, entry.metricas);
      baselineMap.set('30820528000178_' + entry.periodo + '_' + entry.filial, entry.metricas);
    }
    if (entry.empresa_id === 'f7acf52e-3f6b-4bff-b561-44f14d0861fa') {
      baselineMap.set('10.237.062/0001-75_' + entry.periodo + '_' + entry.filial, entry.metricas);
      baselineMap.set('10237062000175_' + entry.periodo + '_' + entry.filial, entry.metricas);
      baselineMap.set('41.341.659/0001-09_' + entry.periodo + '_' + entry.filial, entry.metricas);
      baselineMap.set('41341659000109_' + entry.periodo + '_' + entry.filial, entry.metricas);
    }
  });
}

// =============================================================================
// RESOLVEDOR CNPJ → UUID
// =============================================================================
let _empresaMapCache = null;
let _empresaMapPromise = null;

async function _carregarMapaEmpresas() {
  try {
    const res = await fetch(SUPABASE_DEFAULT_URL + '/rest/v1/empresas?select=id,cnpj&ativo=eq.true', {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      }
    });
    if (res.ok) {
      const rows = await res.json();
      const mapa = new Map();
      if (Array.isArray(rows)) {
        rows.forEach(e => {
          if (e.cnpj && e.id) {
            mapa.set(e.cnpj, e.id);
            mapa.set(e.cnpj.replace(/\D/g, ''), e.id);
            mapa.set(e.id, e.id);
          }
        });
      }
      return mapa;
    }
  } catch (err) {
    console.warn('Falha ao carregar mapa de empresas CNPJ→UUID:', err);
  }
  return new Map();
}

async function resolverEmpresaId(empresaId) {
  if (!empresaId || empresaId === 'todas') return 'todas';

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(empresaId)) {
    return empresaId;
  }

  if (!_empresaMapCache) {
    if (!_empresaMapPromise) {
      _empresaMapPromise = _carregarMapaEmpresas().then(m => {
        _empresaMapCache = m;
        _empresaMapPromise = null;
        return m;
      });
    }
    await _empresaMapPromise;
  }

  if (_empresaMapCache) {
    const uuid = _empresaMapCache.get(empresaId) || _empresaMapCache.get(empresaId.replace(/\D/g, ''));
    if (uuid) return uuid;
  }

  return empresaId;
}

export function getMetricsCacheKey(empresaId, periodoPreset, unidade, dataInicio, dataFim) {
  const isCustom = periodoPreset === 'custom';
  return (empresaId || 'todas') + '_' + (periodoPreset || 'mes_atual') + '_' + (unidade || 'Todas') + '_' + (isCustom ? (dataInicio || '') : '') + '_' + (isCustom ? (dataFim || '') : '');
}

export function clearMetricsCache() {
  metricsCache.clear();
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('nexabi_metrics_')) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Erro ao limpar cache local:', e);
  }
}

/**
 * Retorna dados em cache de forma 100% síncrona (0ms) para renderização imediata.
 * NUNCA retorna null para períodos canônicos (usa o baseline embarcado caso não haja cache local).
 */
export function getCachedCompanyMetrics(
  empresaId = null, 
  periodoPreset = 'mes_atual', 
  unidade = 'Todas',
  dataInicio = null,
  dataFim = null
) {
  const cacheKey = getMetricsCacheKey(empresaId, periodoPreset, unidade, dataInicio, dataFim);
  
  // 1. Memória RAM instantânea
  if (metricsCache.has(cacheKey)) {
    return metricsCache.get(cacheKey);
  }

  // 2. localStorage da versão corrente
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + cacheKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.data && parsed.data.hasData) {
        metricsCache.set(cacheKey, parsed.data);
        return parsed.data;
      }
    }
  } catch (e) {}

  // 3. Fallback inteligente: buscar de versões anteriores no localStorage (evita tela zerada após deploys)
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('nexabi_metrics_') && k.endsWith(cacheKey)) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.data && parsed.data.hasData) {
            metricsCache.set(cacheKey, parsed.data);
            return parsed.data;
          }
        }
      }
    }
  } catch (e) {}

  // 4. Baseline embarcado estático (Garantia de 0ms sem tela zerada)
  if (periodoPreset !== 'custom') {
    const targetEmp = empresaId || 'todas';
    const targetPer = periodoPreset || 'mes_atual';
    const targetFil = unidade || 'Todas';

    const baseline = baselineMap.get(targetEmp + '_' + targetPer + '_' + targetFil) ||
                     baselineMap.get(targetEmp + '_' + targetPer + '_Todas') ||
                     baselineMap.get('todas_' + targetPer + '_Todas') ||
                     baselineMap.get('todas_mes_atual_Todas');
                     
    if (baseline) {
      metricsCache.set(cacheKey, baseline);
      return baseline;
    }
  }

  return null;
}

/**
 * Consulta de indicadores com desduplicação de chamadas concorrentes e resiliência máxima.
 */
export function fetchCompanyMetrics(
  empresaId = null, 
  periodoPreset = 'mes_atual', 
  unidade = 'Todas',
  dataInicio = null,
  dataFim = null,
  forceRefresh = false
) {
  const reqKey = (empresaId || 'todas') + '_' + (periodoPreset || 'mes_atual') + '_' + (unidade || 'Todas') + '_' + (dataInicio || '') + '_' + (dataFim || '') + '_' + forceRefresh;
  
  // Se já existir uma requisição idêntica em trânsito pela rede, reaproveita a mesma Promise
  if (inFlightRequests.has(reqKey)) {
    return inFlightRequests.get(reqKey);
  }

  const promise = _doFetchCompanyMetrics(
    empresaId, 
    periodoPreset, 
    unidade, 
    dataInicio, 
    dataFim, 
    forceRefresh
  ).finally(() => {
    inFlightRequests.delete(reqKey);
  });

  inFlightRequests.set(reqKey, promise);
  return promise;
}

async function _doFetchCompanyMetrics(
  empresaId = null, 
  periodoPreset = 'mes_atual', 
  unidade = 'Todas',
  dataInicio = null,
  dataFim = null,
  forceRefresh = false
) {
  const cacheKey = getMetricsCacheKey(empresaId, periodoPreset, unidade, dataInicio, dataFim);
  const now = Date.now();

  const targetEmpresaRaw = empresaId || 'todas';
  const targetEmpresa = await resolverEmpresaId(targetEmpresaRaw);
  const targetPeriodo = periodoPreset || 'mes_atual';
  const targetUnidade = unidade || 'Todas';

  // 1. Consulta prioritária à tabela bi_dashboard_cache (para todos os presets canônicos)
  if (periodoPreset !== 'custom') {
    try {
      if (forceRefresh) {
        try {
          fetch(SUPABASE_DEFAULT_URL + '/rest/v1/rpc/refresh_dashboard_cache', {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              p_empresa_id: targetEmpresa,
              p_modulo: 'todos',
              p_periodo: targetPeriodo
            })
          }).catch(() => {});
        } catch (_) {}
      }
      const cacheBuster = forceRefresh ? '&_t=' + now : '';
      const cacheUrl = SUPABASE_DEFAULT_URL + '/rest/v1/bi_dashboard_cache?empresa_id=eq.' + encodeURIComponent(targetEmpresa) + '&periodo=eq.' + encodeURIComponent(targetPeriodo) + '&filial=eq.' + encodeURIComponent(targetUnidade) + '&select=metricas,atualizado_em' + cacheBuster;
      
      const ctrlFast = new AbortController();
      const tidFast = setTimeout(() => ctrlFast.abort(), 20000); // 20s de margem segura para conexões móveis e picos de I/O

      const cacheRes = await fetch(cacheUrl, {
        signal: ctrlFast.signal,
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
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
      console.warn('Consulta a bi_dashboard_cache em background:', cacheErr);
    }

    // Se o bi_dashboard_cache falhou ou demorou, retorna o baseline seguro ou snapshot em RAM
    // NUNCA executar o RPC pesado get_dashboard_metrics para períodos canônicos pré-calculados!
    const fallbackData = metricsCache.get(cacheKey) || 
                         baselineMap.get(targetEmpresa + '_' + targetPeriodo + '_' + targetUnidade) ||
                         baselineMap.get(targetEmpresa + '_' + targetPeriodo + '_Todas') ||
                         baselineMap.get('todas_' + targetPeriodo + '_Todas');
    if (fallbackData) {
      console.info('Preservando baseline seguro para garantir estabilidade contínua');
      return fallbackData;
    }
  }

  // 2. Consulta dinâmica via RPC get_dashboard_metrics APENAS para períodos personalizados (custom)
  if (periodoPreset === 'custom') {
    try {
      const payload = {
        p_empresa_id: targetEmpresa,
        p_periodo: targetPeriodo,
        p_filial: targetUnidade
      };

      if (dataInicio && dataFim) {
        payload.p_dt_inicio = dataInicio;
        payload.p_dt_fim = dataFim;
      }

      const ctrlRPC = new AbortController();
      const tidRPC = setTimeout(() => ctrlRPC.abort(), 35000);

      const res = await fetch(SUPABASE_DEFAULT_URL + '/rest/v1/rpc/get_dashboard_metrics', {
        method: 'POST',
        signal: ctrlRPC.signal,
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
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
  }

  // 3. Fallback de Segurança Máxima (nunca zerar a tela)
  const existingData = metricsCache.get(cacheKey) || baselineMap.get('todas_mes_atual_Todas');
  if (existingData) {
    return existingData;
  }

  // 4. Último recurso defensivo estruturado
  return {
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
}
