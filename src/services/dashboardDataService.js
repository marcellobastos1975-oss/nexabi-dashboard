import { SUPABASE_DEFAULT_URL, SUPABASE_ANON_KEY } from '../config';

const metricsCache = new Map();

export async function fetchCompanyMetrics(empresaId = null, periodoPreset = 'mes_atual', unidade = 'Todas') {
  const cacheKey = `${empresaId || 'todas'}_${periodoPreset || 'mes_atual'}_${unidade || 'Todas'}`;

  // Se já tiver em cache na sessão atual, retorna imediatamente
  if (metricsCache.has(cacheKey)) {
    return metricsCache.get(cacheKey);
  }

  try {
    const res = await fetch(`${SUPABASE_DEFAULT_URL}/rest/v1/rpc/get_dashboard_metrics`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_empresa_id: empresaId || 'todas',
        p_periodo: periodoPreset || 'mes_atual',
        p_filial: unidade || 'Todas'
      })
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
    valorCR: '0,00',
    valorCP: '0,00',
    valorEstoque: '0,00',
    contasFinanc: '0,00',
    margemBruta: '0,00',
    inadimplencia: '0,00',
    impostosDiretos: '0,00',
    cmv: '0,00',
    margemContribuicao: '0,00',
    metaVenda: '0,00',
    metaAtingida: '0,00'
  };
  return emptyFallback;
}
