// ============================================================================
// NexaBI — Alpha Suite | Store de Gestão de Empresas & Chaves de Ingestão (API Keys)
// Multi-Tenant: Gerenciamento de Clientes, Integração Supabase e Geração de Tokens
// ============================================================================

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

const EMPRESAS_CACHE_KEY = 'nexabi_empresas_cache';

export const EMPRESAS_PADRAO = [
  {
    id: 'e0b957c7-2cfb-4e34-bdb3-fec462e71931',
    razao_social: 'LOJAS SILVA CASA & CONFORTO LTDA',
    nome_fantasia: 'Lojas Silva (Demonstração)',
    cnpj: '00.000.000/0001-00',
    api_key: 'NEXABI_DEMO_KEY_2026',
    erp_tipo: 'PROTON',
    banco_tipo: 'ORACLE',
    ativo: true,
    criado_em: '2026-08-20T18:42:03Z'
  },
  {
    id: 'f1c234a5-6789-4bcd-8ef0-1234567890ab',
    razao_social: 'REDE NORDESTE MÓVEIS & ELETRO LTDA',
    nome_fantasia: 'Rede Nordeste Móveis & Eletro',
    cnpj: '11.222.333/0001-44',
    api_key: 'NEXABI_SEC_NORDESTE_2026',
    erp_tipo: 'PROTON',
    banco_tipo: 'ORACLE',
    ativo: true,
    criado_em: '2026-08-21T10:00:00Z'
  },
  {
    id: 'a9b8c7d6-e5f4-3210-fedc-ba9876543210',
    razao_social: 'ALPHA DISTRIBUIDORA DE ALIMENTOS & LOGÍSTICA S.A.',
    nome_fantasia: 'Alpha Distribuidora & Logística',
    cnpj: '22.333.444/0001-55',
    api_key: 'NEXABI_SEC_ALPHA_2026',
    erp_tipo: 'TOTVS_PROTHEUS',
    banco_tipo: 'SQLSERVER',
    ativo: true,
    criado_em: '2026-08-21T12:00:00Z'
  }
];

export function gerarApiKeySegura(cnpj) {
  const limpo = (cnpj || '').replace(/\D/g, '') || '000';
  const aleatorio = Math.random().toString(36).substring(2, 8).toUpperCase() + 
                    Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NEXABI_SEC_${limpo}_${aleatorio}`;
}

export async function getTodasEmpresas() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/empresas?select=*&order=criado_em.desc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(EMPRESAS_CACHE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch (err) {
    console.warn('Falha ao consultar Supabase REST para empresas:', err);
  }

  // Fallback cache local ou padrão
  try {
    const salvo = localStorage.getItem(EMPRESAS_CACHE_KEY);
    if (salvo) return JSON.parse(salvo);
  } catch {}

  return EMPRESAS_PADRAO;
}

export async function cadastrarEmpresa({ razao_social, nome_fantasia, cnpj, erp_tipo = 'PROTON', banco_tipo = 'ORACLE' }) {
  const cnpjLimpo = (cnpj || '').trim();
  const token = gerarApiKeySegura(cnpjLimpo);

  const nova = {
    razao_social: razao_social.trim().toUpperCase(),
    nome_fantasia: (nome_fantasia || razao_social).trim(),
    cnpj: cnpjLimpo,
    api_key: token,
    erp_tipo,
    banco_tipo,
    ativo: true
  };

  // 1. Tenta salvar no Supabase
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/empresas`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(nova)
    });

    if (res.ok) {
      const data = await res.json();
      const salva = data && data[0] ? data[0] : nova;
      // Atualiza cache local
      const listaAtual = await getTodasEmpresas();
      const atualizada = [salva, ...listaAtual.filter(e => e.cnpj !== cnpjLimpo)];
      localStorage.setItem(EMPRESAS_CACHE_KEY, JSON.stringify(atualizada));
      return { sucesso: true, empresa: salva, api_key: token };
    } else {
      const errText = await res.text();
      // Se der erro no Supabase (ex: CNPJ duplicado), retorna o erro
      if (errText.includes('duplicate key') || errText.includes('unique')) {
        return { sucesso: false, erro: 'Já existe uma empresa cadastrada com este CNPJ.' };
      }
    }
  } catch (err) {
    console.warn('Erro ao salvar no Supabase, salvando localmente:', err);
  }

  // Fallback local
  nova.id = `local-${Date.now()}`;
  nova.criado_em = new Date().toISOString();
  const listaAtual = await getTodasEmpresas();
  const atualizada = [nova, ...listaAtual.filter(e => e.cnpj !== cnpjLimpo)];
  localStorage.setItem(EMPRESAS_CACHE_KEY, JSON.stringify(atualizada));
  return { sucesso: true, empresa: nova, api_key: token };
}

export async function atualizarEmpresa(id, dados) {
  const dadosAtualizados = {
    razao_social: (dados.razao_social || '').trim().toUpperCase(),
    nome_fantasia: (dados.nome_fantasia || dados.razao_social || '').trim(),
    cnpj: (dados.cnpj || '').trim(),
    erp_tipo: dados.erp_tipo || 'PROTON',
    banco_tipo: dados.banco_tipo || 'ORACLE',
    atualizado_em: new Date().toISOString()
  };

  if (dados.api_key) {
    dadosAtualizados.api_key = dados.api_key;
  }

  // 1. Tenta atualizar no Supabase
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/empresas?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(dadosAtualizados)
    });

    if (res.ok) {
      const data = await res.json();
      const salva = data && data[0] ? data[0] : { id, ...dadosAtualizados };
      const listaAtual = await getTodasEmpresas();
      const atualizada = listaAtual.map(e => e.id === id ? { ...e, ...salva } : e);
      localStorage.setItem(EMPRESAS_CACHE_KEY, JSON.stringify(atualizada));
      return { sucesso: true, empresa: salva };
    }
  } catch (err) {
    console.warn('Erro ao atualizar no Supabase:', err);
  }

  // Fallback local
  const listaAtual = await getTodasEmpresas();
  const atualizada = listaAtual.map(e => e.id === id ? { ...e, ...dadosAtualizados } : e);
  localStorage.setItem(EMPRESAS_CACHE_KEY, JSON.stringify(atualizada));
  return { sucesso: true, empresa: { id, ...dadosAtualizados } };
}

export async function excluirEmpresa(id) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/empresas?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
  } catch (err) {
    console.warn('Erro ao excluir no Supabase:', err);
  }

  try {
    const listaAtual = await getTodasEmpresas();
    const filtrada = listaAtual.filter(e => e.id !== id);
    localStorage.setItem(EMPRESAS_CACHE_KEY, JSON.stringify(filtrada));
    return true;
  } catch {
    return false;
  }
}
