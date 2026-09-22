"""
NexaBI — Alpha Suite | Validador de Credenciais do Perfil Master (NexaLife Tech)
Validação Estrita de Credenciais via Base do Dashboard (Supabase Cloud public.bi_usuarios).
Apenas usuários ativos com perfil 'master' no Dashboard têm permissão de acesso.
Zero senhas fixas no código: validação dinâmica exclusivamente contra o cadastro do Supabase em tempo real.
"""
import logging
import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

logger = logging.getLogger("NexaBI-AuthMaster")

SUPABASE_DEFAULT_URL = "https://fwlexdycmquuwfrfwokv.supabase.co"
SUPABASE_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bGV4ZHljbXF1dXdmcmZ3b2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNDI3NjQsImV4cCI6MjEwMjgxODc2NH0."
    "yb-ViQXYCUDiL2-3bXeKKw7HAubdd5jCy57Hf18OTIE"
)

def _criar_sessao_autenticacao():
    s = requests.Session()
    retries = Retry(
        total=3,
        backoff_factor=1.0,
        status_forcelist=[429, 500, 502, 503, 504],
        raise_on_status=False
    )
    adapter = HTTPAdapter(max_retries=retries, pool_connections=5, pool_maxsize=10)
    s.mount("https://", adapter)
    s.mount("http://", adapter)
    return s

def _extrair_senhas_validas(user_data):
    """Extrai todas as senhas válidas cadastradas para o usuário no Supabase (colunas 'senha' e 'senhas')."""
    senhas_validas = set()
    senha_unica = str(user_data.get("senha") or "").strip()
    if senha_unica:
        senhas_validas.add(senha_unica)
    senhas_remotas = user_data.get("senhas") or []
    if isinstance(senhas_remotas, list):
        for s in senhas_remotas:
            if s and str(s).strip():
                senhas_validas.add(str(s).strip())
    elif senhas_remotas:
        senhas_validas.add(str(senhas_remotas).strip())
    return senhas_validas

def validar_credencial_master(usuario_str, senha_str):
    """
    Valida credenciais do perfil Master no Supabase Cloud (public.bi_usuarios).
    1. Consulta em tempo real na nuvem Supabase pelo username e ativo=true.
    2. Valida se o usuário existe, está ativo e possui perfil estritamente 'master'.
    3. Valida dinamicamente se a senha informada confere com a cadastrada no Supabase.
    Zero senhas fixas no código.
    """
    if not usuario_str or not senha_str:
        logger.warning("[AUTH] Tentativa de validação com usuário ou senha em branco.")
        return False, "Usuário e senha são obrigatórios."

    u = str(usuario_str).strip().lower()
    p = str(senha_str).strip()

    logger.info(f"[AUTH] Validando credencial Master para o usuário: '{u}' via Supabase Cloud...")

    try:
        url = f"{SUPABASE_DEFAULT_URL}/rest/v1/bi_usuarios"
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Accept": "application/json"
        }
        session = _criar_sessao_autenticacao()
        r = session.get(
            f"{url}?username=ilike.{u}&ativo=eq.true&select=id,username,nome,perfil,ativo,senhas,senha",
            headers=headers,
            timeout=(10.0, 30.0)
        )
        logger.info(f"[AUTH] Consulta Supabase 'bi_usuarios' para '{u}': HTTP {r.status_code}")

        if r.status_code != 200:
            logger.error(f"[AUTH] Erro ao consultar Supabase (HTTP {r.status_code}): {r.text[:100]}")
            return False, f"Falha na comunicação com o Supabase Cloud (HTTP {r.status_code}). Tente novamente."

        rows = r.json()
        if not rows:
            logger.warning(f"[AUTH] Usuário '{u}' não encontrado ou inativo no Supabase.")
            return False, f"O usuário '{u}' não foi encontrado ou está inativo no Supabase."

        user_data = rows[0]

        # 1. Validação estrita de perfil Master
        perfil = str(user_data.get("perfil") or "").strip().lower()
        if perfil != "master":
            logger.warning(f"[AUTH] Acesso negado: o usuário '{u}' possui perfil '{perfil}' e não é Master.")
            return False, f"Acesso negado: o usuário '{u}' possui perfil '{perfil}' e não possui permissão Master no Dashboard."

        # 2. Validação dinâmica de senha contra o registro do Supabase
        senhas_validas = _extrair_senhas_validas(user_data)

        if p in senhas_validas or any(p == str(s).strip() for s in senhas_validas):
            logger.info(f"[AUTH] Usuário Master '{u}' autenticado com SUCESSO via Supabase!")
            return True, f"Usuário Master '{u}' autenticado com sucesso pelo Supabase."
        else:
            logger.warning(f"[AUTH] Senha incorreta informada para o usuário Master '{u}'.")
            return False, "Senha incorreta para o perfil Master do Dashboard."

    except requests.exceptions.Timeout:
        logger.error(f"[AUTH] Timeout ao conectar no Supabase Cloud para validar '{u}'.")
        return False, "Tempo limite esgotado ao conectar ao Supabase Cloud. Verifique sua conexão com a internet."
    except Exception as e:
        logger.error(f"[AUTH] Erro inesperado ao validar credencial no Supabase: {e}")
        return False, f"Falha ao validar credencial no Supabase: {str(e)}"
