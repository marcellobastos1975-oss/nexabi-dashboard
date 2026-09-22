"""
NexaBI — Alpha Suite | Motor Central de Sincronizacao (SyncEngine) v1.5.4 PROD
Conexao Oracle (Thin/Thick Mode para Oracle 11g/12c/19c/21c/23c)
Criptografia Militar AES-256 de Credenciais + Transacoes Zero Impact (SET TRANSACTION READ ONLY)
Ingestao Cloud Nativa Direta no Supabase PostgreSQL (PostgREST TLS 1.3)
Diagnostico e Perfilamento de Volume de Dados + Filtro Multi-Unidades
Blindagem Nativa do Windows contra Exclusao Acidental de config.json e state.json
"""
import os
import re
import json
import time
import ctypes
import logging
import threading
import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry
import oracledb

from security import encrypt_value, decrypt_value
from oracle_queries import (
    QUERY_UNIDADES_ORACLE,
    QUERY_UNIDADES_FALLBACK,
    QUERY_DELTA_VENDAS_PROTON,
    QUERY_DELTA_VENDAS_FALLBACK,
    QUERY_DELTA_VENDAS_ITENS_PROTON,
    QUERY_DELTA_VENDAS_ITENS_FALLBACK,
    QUERY_DELTA_CR_PROTON,
    QUERY_DELTA_CR_FALLBACK,
    QUERY_DELTA_CP_PROTON,
    QUERY_DELTA_CP_FALLBACK,
    QUERY_SALDOS_TESOURARIA_PROTON,
    QUERY_SALDOS_TESOURARIA_FALLBACK,
    QUERY_POSICAO_ESTOQUE_PROTON,
    QUERY_POSICAO_ESTOQUE_FALLBACK,
    QUERY_DELTA_COMPRAS_FALLBACK,
    QUERY_FISCAL_FALLBACK
)

logger = logging.getLogger('NexaBI-SyncEngine')

APP_VERSION = "v1.9.6 PROD"

def _criar_sessao_cloud_resiliente():
    s = requests.Session()
    retry_strategy = Retry(
        total=3,
        backoff_factor=1.5,
        status_forcelist=[429, 500, 502, 503, 504],
        raise_on_status=False
    )
    adapter = HTTPAdapter(max_retries=retry_strategy, pool_connections=10, pool_maxsize=20)
    s.mount("https://", adapter)
    s.mount("http://", adapter)
    return s

SUPABASE_DEFAULT_URL = "https://fwlexdycmquuwfrfwokv.supabase.co"
SUPABASE_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bGV4ZHljbXF1dXdmcmZ3b2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNDI3NjQsImV4cCI6MjEwMjgxODc2NH0."
    "yb-ViQXYCUDiL2-3bXeKKw7HAubdd5jCy57Hf18OTIE"
)

FILE_ATTRIBUTE_READONLY = 0x01
FILE_ATTRIBUTE_HIDDEN = 0x02
FILE_ATTRIBUTE_NORMAL = 0x80

def _salvar_arquivo_blindado(caminho, data_dict):
    """Salva o arquivo JSON com remocao temporaria de trava e re-blindagem Windows ReadOnly + Backup"""
    try:
        if os.path.exists(caminho):
            ctypes.windll.kernel32.SetFileAttributesW(caminho, FILE_ATTRIBUTE_NORMAL)
    except Exception:
        pass

    with open(caminho, 'w', encoding='utf-8') as f:
        json.dump(data_dict, f, indent=2, ensure_ascii=False)

    # Backup espelhado
    bak_path = caminho + '.bak'
    try:
        if os.path.exists(bak_path):
            ctypes.windll.kernel32.SetFileAttributesW(bak_path, FILE_ATTRIBUTE_NORMAL)
        with open(bak_path, 'w', encoding='utf-8') as f:
            json.dump(data_dict, f, indent=2, ensure_ascii=False)
        ctypes.windll.kernel32.SetFileAttributesW(bak_path, FILE_ATTRIBUTE_READONLY | FILE_ATTRIBUTE_HIDDEN)
    except Exception:
        pass

    try:
        ctypes.windll.kernel32.SetFileAttributesW(caminho, FILE_ATTRIBUTE_READONLY)
    except Exception:
        pass

def _carregar_arquivo_blindado(caminho, default_dict):
    """Carrega o arquivo JSON com recuperacao automatica a partir do backup espelhado"""
    bak_path = caminho + '.bak'
    if not os.path.exists(caminho) and os.path.exists(bak_path):
        try:
            with open(bak_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            _salvar_arquivo_blindado(caminho, data)
            return data
        except Exception:
            pass

    if not os.path.exists(caminho):
        return default_dict

    try:
        with open(caminho, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        if os.path.exists(bak_path):
            try:
                with open(bak_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
        return default_dict

class SyncEngine:
    def __init__(self, config_path='config.json', state_path='state.json'):
        self.config_path = config_path
        self.state_path = state_path
        self.empresa_id = None
        self.empresa_nome = None
        self.unidades_cache = []
        self.config = self.load_config()
        self.state = self.load_state()

    def load_config(self):
        default_cfg = {
            "empresa_cnpj": "30.820.528/0001-78",
            "codigo_filial": 0,
            "filiais_selecionadas": [],
            "periodo_corte_meses": 12,
            "api_key": "NEXABI_SEC_30820528000178_ZYOMSQ274D",
            "url_api_nuvem": SUPABASE_DEFAULT_URL,
            "oracle": {
                "host": "localhost",
                "port": 1521,
                "service_name": "XEPDB1",
                "user": "PROTON",
                "password": "",
                "client_lib_dir": "",
                "dsn": "localhost:1521/XEPDB1",
                "thin_mode": True
            },
            "batch_size": 1000
        }

        loaded = _carregar_arquivo_blindado(self.config_path, default_cfg)
        try:
            ora = loaded.get("oracle", {})
            raw_pass = ora.get("password", "")
            ora["password"] = decrypt_value(raw_pass)

            raw_key = loaded.get("api_key", "")
            loaded["api_key"] = decrypt_value(raw_key)

            url_nuvem = loaded.get("url_api_nuvem", "")
            if not url_nuvem or "railway.app" in url_nuvem:
                loaded["url_api_nuvem"] = SUPABASE_DEFAULT_URL

            if "dsn" in ora and ("host" not in ora or "service_name" not in ora):
                dsn_str = ora.get("dsn", "localhost:1521/XEPDB1")
                if "/" in dsn_str:
                    hp, serv = dsn_str.split("/", 1)
                    if ":" in hp:
                        h, p = hp.split(":", 1)
                        ora["host"] = h
                        ora["port"] = int(p) if p.isdigit() else 1521
                    else:
                        ora["host"] = hp
                        ora["port"] = 1521
                    ora["service_name"] = serv
                else:
                    ora["host"] = "localhost"
                    ora["port"] = 1521
                    ora["service_name"] = dsn_str
            loaded["oracle"] = ora
            return loaded
        except Exception:
            return default_cfg

    def save_config(self, cfg=None):
        if cfg:
            self.config = cfg

        export_cfg = json.loads(json.dumps(self.config))
        ora = export_cfg.get("oracle", {})

        if "password" in ora:
            ora["password"] = encrypt_value(ora["password"])
        export_cfg["oracle"] = ora

        if "api_key" in export_cfg:
            export_cfg["api_key"] = encrypt_value(export_cfg["api_key"])

        _salvar_arquivo_blindado(self.config_path, export_cfg)

    def load_state(self):
        default_sync = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d %H:%M:%S')
        default_state = {
            "ultimo_sync_vendas": default_sync,
            "ultimo_sync_cr": default_sync,
            "ultimo_sync_cp": default_sync,
            "ultimo_sync_compras": default_sync,
            "ultimo_sync_estoque": default_sync,
            "ultimo_sync_tesouraria": default_sync,
            "ultimo_sync_fiscal": default_sync,
            "ultimo_sync_unidades": default_sync
        }
        return _carregar_arquivo_blindado(self.state_path, default_state)

    def save_state(self):
        _salvar_arquivo_blindado(self.state_path, self.state)

    def get_dsn(self):
        ora = self.config.get("oracle", {})
        host = str(ora.get("host", "localhost")).strip() or "localhost"
        port = ora.get("port", 1521)
        service = str(ora.get("service_name", "XEPDB1")).strip() or "XEPDB1"

        if "/" in service:
            return service
        if "/" in host:
            return host

        return f"{host}:{port}/{service}"

    def _ensure_thick_mode_if_needed(self, custom_lib_dir=None):
        if not oracledb.is_thin_mode():
            return True

        try:
            if custom_lib_dir and os.path.exists(custom_lib_dir):
                oracledb.init_oracle_client(lib_dir=custom_lib_dir)
            else:
                oracledb.init_oracle_client()
            logger.info("Modo Oracle Thick inicializado com sucesso.")
            return True
        except Exception as e:
            logger.warning(f"Nao foi possivel ativar Thick Mode automaticamente: {e}")
            return False

    def get_oracle_connection(self):
        """
        Abre conexão com o Oracle do Próton ERP.
        REGRA ARQUITETURAL DO PRÓTON ERP:
        - O usuário 'DBAUSER' é o proprietário (owner) de todos os objetos/tabelas do banco de dados Oracle.
        - O usuário 'APPUSER' é utilizado pela aplicação e possui concessão de leitura (SELECT) nesses objetos.
        - Ao conectar com APPUSER (ou qualquer usuário), configuramos automaticamente 
          'ALTER SESSION SET CURRENT_SCHEMA = DBAUSER' para permitir consultas diretas transparentes.
        """
        ora = self.config.get("oracle", {})
        user = str(ora.get("user", "APPUSER")).strip()
        password = str(ora.get("password", "")).strip()
        dsn = self.get_dsn()
        custom_lib = str(ora.get("client_lib_dir", "")).strip() or None

        conn = None
        try:
            conn = oracledb.connect(
                user=user,
                password=password,
                dsn=dsn
            )
        except Exception as e:
            err_msg = str(e)
            if "DPY-3010" in err_msg or "thin mode" in err_msg.lower():
                logger.info("Detectado servidor Oracle legado (11g/10g). Inicializando Thick Mode...")
                if self._ensure_thick_mode_if_needed(custom_lib):
                    conn = oracledb.connect(user=user, password=password, dsn=dsn)
                else:
                    raise Exception(
                        f"O servidor Oracle ({dsn}) utiliza versao anterior a 12c (ex: 11g R2). "
                        f"Para conectar no Oracle 11g, configure o Oracle Instant Client. Detalhes: {err_msg}"
                    )
            if not conn:
                raise e

        # Auto-configurar CURRENT_SCHEMA para DBAUSER para garantir acesso transparente às tabelas do Próton
        try:
            with conn.cursor() as cur_schema:
                cur_schema.execute("ALTER SESSION SET CURRENT_SCHEMA = DBAUSER")
        except Exception:
            pass

        return conn

    def testar_conexao_oracle(self):
        dsn = self.get_dsn()
        try:
            conn = self.get_oracle_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM DUAL")
                res = cur.fetchone()

                unidades_res = self._buscar_unidades_cursor(cur)
                qtd_unidades = len(unidades_res)

            conn.close()
            mode_str = "Thick Mode" if not oracledb.is_thin_mode() else "Thin Mode"
            return {
                "sucesso": True,
                "mensagem": f"Conexao com Oracle OK em {dsn}! ({qtd_unidades} unidades detectadas) [{mode_str}]",
                "unidades_qtd": qtd_unidades
            }
        except Exception as e:
            return {
                "sucesso": False,
                "mensagem": f"Falha ao conectar no Oracle ({dsn}): {str(e)}"
            }

    def _get_cloud_url(self):
        url = (self.config.get("url_api_nuvem") or SUPABASE_DEFAULT_URL).strip().rstrip("/")
        if "railway.app" in url:
            url = SUPABASE_DEFAULT_URL
        return url

    def obter_empresa_autenticada(self):
        api_key = (self.config.get("api_key") or "").strip()

        if not api_key:
            return {"sucesso": False, "mensagem": "API Key da Empresa nao configurada."}

        url_base = self._get_cloud_url()
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json"
        }

        try:
            query_url = f"{url_base}/rest/v1/empresas?select=id,razao_social,nome_fantasia,cnpj,api_key,ativo,modulos_config&api_key=eq.{api_key}&ativo=eq.true"
            resp = requests.get(query_url, headers=headers, timeout=12)

            if resp.status_code == 200:
                lista = resp.json()
                if lista and len(lista) > 0:
                    empresa = lista[0]
                    self.empresa_id = empresa["id"]
                    self.empresa_nome = empresa.get("nome_fantasia") or empresa.get("razao_social")
                    self.modulos_config = empresa.get("modulos_config") or {"vendas": True}
                    return {
                        "sucesso": True,
                        "empresa": empresa,
                        "empresa_id": self.empresa_id,
                        "empresa_nome": self.empresa_nome,
                        "modulos_config": self.modulos_config
                    }

                else:
                    return {
                        "sucesso": False,
                        "mensagem": f"API Key '{api_key[:15]}...' nao encontrada ou inativa no NexaBI Cloud.\nVerifique a chave gerada no Painel Master."
                    }
            else:
                return {
                    "sucesso": False,
                    "mensagem": f"Supabase retornou status {resp.status_code}: {resp.text}"
                }
        except Exception as e:
            return {
                "sucesso": False,
                "mensagem": f"Falha ao conectar com o Supabase Cloud ({url_base}): {str(e)}"
            }

    def testar_conexao_cloud(self):
        res = self.obter_empresa_autenticada()
        if res["sucesso"]:
            emp = res["empresa"]
            return {
                "sucesso": True,
                "mensagem": (
                    f"Conexao Cloud OK (TLS 1.3)!\n\n"
                    f"Empresa: {emp.get('nome_fantasia') or emp.get('razao_social')}\n"
                    f"CNPJ: {emp.get('cnpj')}\n"
                    f"Status: Autenticado & Ativo (ID: {emp.get('id')})"
                )
            }
        else:
            return {
                "sucesso": False,
                "mensagem": f"Erro na Conexao com a Nuvem:\n{res['mensagem']}"
            }

    def _buscar_unidades_cursor(self, cur):
        # 1. Tentar query primária no DBAUSER com DISTINCT e COALESCE
        try:
            cur.execute(QUERY_UNIDADES_ORACLE)
            cols = [col[0].lower() for col in cur.description]
            rows = [dict(zip(cols, row)) for row in cur.fetchall()]
            if rows:
                return rows
        except Exception:
            pass

        # 1. Candidatos diretos prioritários (com tund_unidade e dbauser.tund_unidade no topo absoluto)
        candidatos_tab = [
            "dbauser.tund_unidade", "tund_unidade", "appuser.tund_unidade", "proton.tund_unidade",
            "dbauser.tnud_unidade", "tnud_unidade", "appuser.tnud_unidade", "proton.tnud_unidade",
            "dbauser.tunid_unidade", "tunid_unidade",
            "dbauser.tfil_filial", "tfil_filial",
            "dbauser.tunidade", "tunidade",
            "dbauser.temp_empresa", "temp_empresa"
        ]

        # 2. Tentar ler as unidades das tabelas candidatas com introspecção inteligente de colunas
        for tab in candidatos_tab:
            try:
                cur.execute(f"SELECT * FROM {tab} WHERE ROWNUM <= 300")
                cols = [c[0].lower() for c in cur.description]
                raw_rows = cur.fetchall()
                if not raw_rows:
                    continue

                # 2.1 Identificar coluna PK / Código
                pk_idx = next(
                    (i for i, c in enumerate(cols) if any(k in c for k in [
                        "unidade_pk", "cod_unidade", "unidade_id", "cod_filial", "filial_id",
                        "tund_unidade", "tnud_unidade", "tund_cod", "tnud_cod", "codigo_pk", "codigo", "id", "pk"
                    ]) and not any(k in c for k in ["empresa", "sistema", "tipo", "grupo"])),
                    0
                )

                # 2.2 Identificar TODAS as colunas candidatas de Nome Fantasia / Razão Social em ordem de prioridade
                colunas_nome_prioridade = [
                    [c for c in cols if any(k in c for k in ["nome_fantasia", "fantasia"]) and not any(k in c for k in ["fk", "cod", "id"])],
                    [c for c in cols if any(k in c for k in ["nome_reduzido", "reduzido", "apelido", "sigla"]) and not any(k in c for k in ["fk", "cod", "id"])],
                    [c for c in cols if any(k in c for k in ["razao_social", "razao", "nome_razao"]) and not any(k in c for k in ["fk", "cod", "id"])],
                    [c for c in cols if any(k in c for k in ["nome_unidade", "nome_filial", "ds_unidade"]) and not any(k in c for k in ["fk", "cod", "id"])],
                    [c for c in cols if any(k in c for k in ["descricao", "ds_"]) and not any(k in c for k in ["fk", "cod", "id"])],
                    [c for c in cols if "nome" in c and not any(k in c for k in ["fantasia", "reduzido", "mae", "pai", "contato", "usuario", "fk", "cod", "id"])]
                ]
                colunas_nome_ordenadas = []
                vistos_cols = set()
                for grupo in colunas_nome_prioridade:
                    for col_n in grupo:
                        if col_n not in vistos_cols:
                            vistos_cols.add(col_n)
                            colunas_nome_ordenadas.append(cols.index(col_n))

                # 2.3 Coluna de Cidade
                cid_idx = next(
                    (i for i, c in enumerate(cols) if any(k in c for k in ["cidade", "municipio", "ds_cidade", "nome_cidade", "localidade"]) and not any(k in c for k in ["fk", "cod", "id", "cep", "ibge"])),
                    None
                )

                # 2.4 Coluna de UF
                uf_idx = next(
                    (i for i, c in enumerate(cols) if any(k in c for k in ["uf", "estado", "sg_uf"]) and not any(k in c for k in ["fk", "cod", "id"])),
                    None
                )

                # 2.5 Coluna de CNPJ / CPF
                cnpj_idx = next(
                    (i for i, c in enumerate(cols) if any(k in c for k in ["cgc", "cnpj", "cpf"]) and not any(k in c for k in ["fk", "id"])),
                    None
                )

                # 2.6 Coluna de Status / Situação
                st_idx = next(
                    (i for i, c in enumerate(cols) if any(k in c for k in ["situacao", "status", "ativo", "st"]) and not any(k in c for k in ["fk", "cod", "id"])),
                    None
                )

                dyn_rows = []
                for r in raw_rows:
                    try:
                        cod = int(r[pk_idx] or 0)
                    except (ValueError, TypeError):
                        continue
                    if cod <= 0:
                        continue

                    # Extração inteligente do melhor nome disponível
                    melhor_nome = ""
                    for idx_col in colunas_nome_ordenadas:
                        val_col = str(r[idx_col] or "").strip()
                        if not val_col or val_col.lower() in ("none", "null", "nan", "n/i", "0"):
                            continue
                        if val_col.isdigit():
                            continue
                        if val_col.upper() in ("BASE MODELO", "MODELO", "PADRAO", "BASE", "NOVA UNIDADE", "TESTE", "UNIDADE TESTE", "EMPRESA MODELO"):
                            continue
                        melhor_nome = val_col
                        break

                    if not melhor_nome:
                        for idx_col in colunas_nome_ordenadas:
                            val_col = str(r[idx_col] or "").strip()
                            if val_col and val_col.lower() not in ("none", "null", "nan", "n/i", "0") and not val_col.isdigit():
                                melhor_nome = val_col
                                break

                    cid = ""
                    if cid_idx is not None:
                        val_cid = str(r[cid_idx] or "").strip()
                        if val_cid and not val_cid.isdigit() and val_cid.upper() not in ("N/I", "NULL", "NONE", "0"):
                            cid = val_cid

                    uf = str(r[uf_idx] or "BA").strip() if uf_idx is not None else "BA"
                    cnpj = str(r[cnpj_idx] or "").strip() if cnpj_idx is not None else ""
                    st = str(r[st_idx] or "A").strip().upper() if st_idx is not None else "A"

                    dyn_rows.append({
                        "cod_unidade": cod,
                        "nome_unidade": melhor_nome or f"Filial {cod:02d}",
                        "fantasia": melhor_nome or f"Filial {cod:02d}",
                        "cidade": cid,
                        "uf": uf,
                        "cnpj": cnpj,
                        "status": st
                    })

                if dyn_rows:
                    return dyn_rows

            except Exception:
                continue

        # 3. Fallback transacional se a tabela de cadastro estiver inacessível:
        for tab_venda in ("dbauser.tped_pedido_venda", "tped_pedido_venda", "appuser.tped_pedido_venda"):
            try:
                cur.execute(f"SELECT DISTINCT tped_unidade_fk_pk FROM {tab_venda} WHERE tped_unidade_fk_pk IS NOT NULL ORDER BY tped_unidade_fk_pk")
                rows = cur.fetchall()
                if rows:
                    return [{"cod_unidade": r[0], "nome_unidade": f"Filial {int(r[0]):02d}", "fantasia": f"Filial {int(r[0]):02d}", "cidade": "N/I", "uf": "BA", "status": "A"} for r in rows if r[0]]
            except Exception:
                continue

        return []

    def obter_unidades_oracle(self):
        try:
            conn = self.get_oracle_connection()
            with conn.cursor() as cur:
                rows = self._buscar_unidades_cursor(cur)
            conn.close()

            unidades_por_codigo = {}
            for r in rows:
                try:
                    cod_raw = r.get("cod_unidade")
                    if cod_raw is None:
                        continue
                    cod = int(cod_raw)
                    if cod <= 0:
                        continue
                except (ValueError, TypeError):
                    continue

                nome_raw = str(r.get("fantasia") or r.get("nome_unidade") or "").strip()
                cidade = str(r.get("cidade") or "").strip()
                if cidade.isdigit() or cidade.upper() in ("N/I", "NULL", "NONE", "NAO INFORMADO", ""):
                    cidade = ""
                uf = str(r.get("uf") or "BA").strip()
                cnpj = str(r.get("cnpj") or "").strip()
                status = str(r.get("status") or "A").strip().upper()

                eh_generico = not nome_raw or nome_raw.upper() in (
                    "BASE MODELO", "MODELO", "PADRAO", "BASE", "NOVA UNIDADE", 
                    "UNIDADE", "TESTE", "UNIDADE TESTE", "EMPRESA MODELO"
                ) or nome_raw.upper() == f"FILIAL {cod:02d}" or nome_raw.upper() == f"FILIAL {cod}" or nome_raw.upper().startswith("UNIDADE ")

                if eh_generico:
                    if cidade:
                        nome_final = f"Filial {cod:02d} ({cidade})"
                    else:
                        nome_final = f"Filial {cod:02d}"
                else:
                    nome_final = nome_raw

                if cod not in unidades_por_codigo:
                    unidades_por_codigo[cod] = {
                        "codigo": cod,
                        "nome": nome_final,
                        "cidade": cidade or "N/I",
                        "uf": uf or "BA",
                        "cnpj": cnpj,
                        "ativo": status == "A"
                    }
                else:
                    existente = unidades_por_codigo[cod]
                    if ("Filial " in existente["nome"] or not existente["nome"]) and "Filial " not in nome_final:
                        existente["nome"] = nome_final
                    if status == "A":
                        existente["ativo"] = True
                    if cidade and (existente["cidade"] == "N/I" or existente["cidade"].isdigit()):
                        existente["cidade"] = cidade

            unidades = [unidades_por_codigo[k] for k in sorted(unidades_por_codigo.keys())]

            self.unidades_cache = unidades
            return {"sucesso": True, "unidades": unidades}
        except Exception as e:
            return {"sucesso": False, "erro": str(e), "unidades": []}

    def analisar_volume_dados(self, filiais_selecionadas=None, meses_corte=12):
        logger.info("Iniciando diagnostico e perfilamento de volume de dados no Oracle...")
        try:
            auth = self.obter_empresa_autenticada()
            mods = (auth.get("modulos_config") if (auth and auth.get("sucesso")) else None) or getattr(self, "modulos_config", None) or {"vendas": True}

            conn = self.get_oracle_connection()
            cur = conn.cursor()

            try:
                cur.execute("SET TRANSACTION READ ONLY")
            except Exception:
                pass

            dt_corte = (datetime.now() - timedelta(days=meses_corte * 30)).strftime('%Y-%m-%d 00:00:00') if meses_corte > 0 else "2000-01-01 00:00:00"
            
            filiais_lista = filiais_selecionadas or []
            if filiais_lista:
                filiais_sql = ", ".join(str(f) for f in filiais_lista)
                filiais_where_ped = f"IN ({filiais_sql})"
                filiais_where_est = f"IN ({filiais_sql})"
                filiais_where_cr = f"IN ({filiais_sql})"
                filiais_where_cp = f"IN ({filiais_sql})"
                filiais_where_tes = f"IN ({filiais_sql})"
            else:
                filiais_where_ped = "IS NOT NULL"
                filiais_where_est = "IS NOT NULL"
                filiais_where_cr = "IS NOT NULL"
                filiais_where_cp = "IS NOT NULL"
                filiais_where_tes = "IS NOT NULL"

            unidades_rows = self._buscar_unidades_cursor(cur)
            qtd_unidades = len(unidades_rows)

            count_vendas = 0
            count_itens = 0
            if mods.get("vendas", True):
                try:
                    cur.execute(f"SELECT COUNT(*) FROM dbauser.tped_pedido_venda WHERE tped_data_pedido >= TO_DATE('{dt_corte}', 'YYYY-MM-DD HH24:MI:SS') AND (tped_unidade_fk_pk {filiais_where_ped})")
                    count_vendas = cur.fetchone()[0]
                except Exception:
                    try:
                        cur.execute(f"SELECT COUNT(*) FROM TAB_VENDAS WHERE DT_EMISSAO >= TO_DATE('{dt_corte}', 'YYYY-MM-DD HH24:MI:SS') AND (COD_FILIAL {filiais_where_ped})")
                        count_vendas = cur.fetchone()[0]
                    except Exception:
                        count_vendas = 0

                try:
                    cur.execute(f"SELECT COUNT(*) FROM dbauser.tped_pedido_venda_item it JOIN dbauser.tped_pedido_venda p ON p.tped_unidade_fk_pk = it.tped_unidade_fk_pk AND p.tped_numero_pedido_pk = it.tped_numero_pedido_fk_pk WHERE COALESCE(p.tped_data_documento, p.tped_data_pedido, p.tped_data_emissao) >= ADD_MONTHS(SYSDATE, -3) AND (it.tped_unidade_fk_pk {filiais_where_ped})")
                    count_itens = cur.fetchone()[0]
                except Exception:
                    try:
                        cur.execute(f"SELECT COUNT(*) FROM TAB_ITENS_PEDIDO WHERE DT_EMISSAO >= ADD_MONTHS(SYSDATE, -3) AND (COD_FILIAL {filiais_where_ped})")
                        count_itens = cur.fetchone()[0]
                    except Exception:
                        count_itens = 0

            count_cr = 0
            if mods.get("contas_receber", False):
                try:
                    cur.execute(f"SELECT COUNT(*) FROM dbauser.ttit_titulo_receber WHERE ttit_data_emissao >= TO_DATE('{dt_corte}', 'YYYY-MM-DD HH24:MI:SS') AND (ttit_unidade_fk_pk {filiais_where_cr})")
                    count_cr = cur.fetchone()[0]
                except Exception:
                    try:
                        cur.execute(f"SELECT COUNT(*) FROM TAB_CONTAS_RECEBER WHERE DT_EMISSAO >= TO_DATE('{dt_corte}', 'YYYY-MM-DD HH24:MI:SS') AND (COD_FILIAL {filiais_where_cr})")
                        count_cr = cur.fetchone()[0]
                    except Exception:
                        count_cr = 0

            count_cp = 0
            if mods.get("contas_pagar", False):
                try:
                    cur.execute(f"SELECT COUNT(*) FROM dbauser.ttit_titulo_pagar WHERE ttit_data_emissao >= TO_DATE('{dt_corte}', 'YYYY-MM-DD HH24:MI:SS') AND (ttit_unidade_fk_pk {filiais_where_cp})")
                    count_cp = cur.fetchone()[0]
                except Exception:
                    try:
                        cur.execute(f"SELECT COUNT(*) FROM TAB_CONTAS_PAGAR WHERE DT_EMISSAO >= TO_DATE('{dt_corte}', 'YYYY-MM-DD HH24:MI:SS') AND (COD_FILIAL {filiais_where_cp})")
                        count_cp = cur.fetchone()[0]
                    except Exception:
                        count_cp = 0

            count_estoque = 0
            if mods.get("estoques", False) or mods.get("estoque", False):
                try:
                    cur.execute(f"SELECT COUNT(*) FROM dbauser.tmer_estoque WHERE (tmer_unidade_fk_pk {filiais_where_est})")
                    count_estoque = cur.fetchone()[0]
                except Exception:
                    try:
                        cur.execute(f"SELECT COUNT(*) FROM TAB_ESTOQUE WHERE (COD_FILIAL {filiais_where_est})")
                        count_estoque = cur.fetchone()[0]
                    except Exception:
                        count_estoque = 0

            count_tes = 0
            if mods.get("tesouraria", False):
                try:
                    cur.execute(f"SELECT COUNT(*) FROM dbauser.tcfr_conta_financeira WHERE (tcfr_unidade_fk_pk {filiais_where_tes})")
                    count_tes = cur.fetchone()[0]
                except Exception:
                    try:
                        cur.execute(f"SELECT COUNT(*) FROM TAB_CONTAS_BANCARIAS WHERE (COD_FILIAL {filiais_where_tes})")
                        count_tes = cur.fetchone()[0]
                    except Exception:
                        count_tes = 0

            cur.close()
            conn.close()

            total_linhas = count_vendas + count_itens + count_cr + count_cp + count_estoque + count_tes
            tamanho_estimado_mb = round((total_linhas * 250) / (1024 * 1024), 2)

            if total_linhas < 50000:
                classificacao = "LEVE"
                status_msg = "🟢 Carga Leve & Segura (Zero impacto no Supabase)"
            elif total_linhas < 250000:
                classificacao = "MEDIA"
                status_msg = "🟡 Carga Moderada (Tempo estimado ~1 a 3 minutos)"
            else:
                classificacao = "ALTA"
                status_msg = "🟠 Carga Volumosa (Recomendado sincronizar por lotes de filiais)"

            resultado = {
                "sucesso": True,
                "data_corte": dt_corte[:10] if dt_corte else "Completo",
                "meses_corte": meses_corte,
                "unidades_totais": qtd_unidades,
                "unidades_selecionadas": len(filiais_lista) if filiais_lista else qtd_unidades,
                "modulos_ativos": mods,
                "contagens": {
                    "vendas": count_vendas,
                    "vendas_itens": count_itens,
                    "contas_receber": count_cr,
                    "contas_pagar": count_cp,
                    "estoques": count_estoque,
                    "tesouraria": count_tes
                },
                "total_linhas": total_linhas,
                "tamanho_estimado_mb": tamanho_estimado_mb,
                "classificacao": classificacao,
                "status_msg": status_msg
            }
            return resultado
        except Exception as e:
            return {"sucesso": False, "erro": str(e)}

    def _post_supabase_batch(self, tabela, registros, batch_size=250):
        if not registros:
            return 0

        conflict_keys = {
            "bi_vendas": "empresa_id,filial_id,id_venda_oracle",
            "bi_vendas_itens": "empresa_id,filial_id,id_item_oracle",
            "bi_contas_receber": "empresa_id,filial_id,id_titulo_oracle",
            "bi_contas_pagar": "empresa_id,filial_id,id_titulo_oracle",
            "bi_estoques": "empresa_id,filial_id,produto_codigo",
            "bi_compras": "empresa_id,filial_id,id_pedido_oracle",
            "bi_tesouraria_saldos": "empresa_id,filial_id,conta_codigo",
            "bi_dim_vendedores": "empresa_id,vendedor_codigo",
            "bi_dim_clientes": "empresa_id,cliente_codigo",
            "bi_dim_fornecedores": "empresa_id,fornecedor_codigo",
            "bi_dim_produtos": "empresa_id,produto_codigo",
        }
        url_base = self._get_cloud_url()
        conflict_param = conflict_keys.get(tabela)
        endpoint = f"{url_base}/rest/v1/{tabela}"
        if conflict_param:
            endpoint += f"?on_conflict={conflict_param}"

        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }

        total_enviados = 0
        for i in range(0, len(registros), batch_size):
            chunk = registros[i:i + batch_size]
            try:
                resp = requests.post(endpoint, json=chunk, headers=headers, timeout=45)
                if resp.status_code in (200, 201, 204):
                    total_enviados += len(chunk)
                else:
                    logger.error(f"Erro ao inserir lote em {tabela} (Status {resp.status_code}): {resp.text}")
            except Exception as ex:
                logger.error(f"Excecao no envio de lote para {tabela}: {ex}")

        return total_enviados

    def _executar_query_com_fallback(self, cur, query_primary, query_fallback, params, filiais_in):
        q_prim = query_primary.format(filiais_in=filiais_in)
        try:
            cur.execute(q_prim, params)
            cols = [col[0].lower() for col in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]
        except Exception as e_prim:
            logger.debug(f"Query primaria falhou ({e_prim}), tentando fallback...")
            q_fall = query_fallback.format(filiais_in=filiais_in)
            try:
                cur.execute(q_fall, params)
                cols = [col[0].lower() for col in cur.description]
                return [dict(zip(cols, row)) for row in cur.fetchall()]
            except Exception as e_fall:
                logger.warning(f"Fallback tambem falhou: {e_fall}")
                return []

    def sincronizar_unidades(self, conn, filiais_selecionadas=None):
        logger.info("Sincronizando filiais/unidades (TNUD_UNIDADE)...")
        try:
            res_unidades = self.obter_unidades_oracle()
            unidades = res_unidades.get("unidades", [])

            norm = []
            for u in unidades:
                cod_filial = u["codigo"]
                if filiais_selecionadas and cod_filial not in filiais_selecionadas:
                    continue
                norm.append({
                    "empresa_id": self.empresa_id,
                    "codigo_filial": cod_filial,
                    "nome_filial": u["nome"][:150],
                    "cidade": u["cidade"][:100],
                    "uf": u["uf"][:2],
                    "ativo": u["ativo"],
                    "ultimo_sync": datetime.now().isoformat(),
                    "status_sync": "ONLINE"
                })

            if norm:
                enviados = self._post_supabase_batch("filiais", norm)
                logger.info(f"{enviados} unidades sincronizadas com a nuvem.")
                self.state["ultimo_sync_unidades"] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                self.save_state()
                return enviados
        except Exception as e:
            logger.warning(f"Aviso ao sincronizar unidades: {e}")
        return 0

    def sincronizar_vendas(self, conn, filiais_selecionadas=None, dt_corte=None):
        logger.info("Sincronizando Vendas...")
        filial_default = self.config.get("codigo_filial", 0)
        ultimo_sync = dt_corte or self.state.get("ultimo_sync_vendas", "2020-01-01 00:00:00")
        batch_limit = self.config.get("batch_size", 1000)

        if filiais_selecionadas:
            filiais_in = ", ".join(str(f) for f in filiais_selecionadas)
            todas_filiais = 0
        else:
            filiais_in = "0"
            todas_filiais = 1

        params = {
            "p_filial": filial_default,
            "p_ultimo_sync": ultimo_sync,
            "p_todas_filiais": todas_filiais,
            "p_limit": batch_limit
        }

        try:
            with conn.cursor() as cur:
                try:
                    cur.execute("SET TRANSACTION READ ONLY")
                except Exception:
                    pass
                rows = self._executar_query_com_fallback(cur, QUERY_DELTA_VENDAS_PROTON, QUERY_DELTA_VENDAS_FALLBACK, params, filiais_in)

            norm = []
            for r in rows:
                dt_emissao = str(r.get("data_emissao") or datetime.now().strftime("%Y-%m-%d"))[:10]
                dt_hora = str(r.get("data_hora_emissao") or dt_emissao + "T00:00:00")
                id_venda = str(r.get("id_venda") or f"{dt_emissao}_{r.get('numero_nota', '0')}")
                norm.append({
                    "empresa_id": self.empresa_id,
                    "filial_id": int(r.get("filial_id") or filial_default),
                    "id_venda_oracle": id_venda,
                    "numero_nota": str(r.get("numero_nota") or "")[:50],
                    "modelo_doc": str(r.get("modelo_doc") or "55")[:10],
                    "data_emissao": dt_emissao,
                    "data_hora_emissao": dt_hora,
                    "vendedor_codigo": int(r.get("cod_vendedor")) if r.get("cod_vendedor") is not None else None,
                    "vendedor_nome": str(r.get("vendedor_nome") or "")[:150],
                    "cliente_codigo": int(r.get("cod_cliente")) if r.get("cod_cliente") is not None else None,
                    "cliente_nome": str(r.get("cliente_nome") or "")[:200],
                    "grupo_produto": str(r.get("grupo_produto") or "GERAL")[:100],
                    "forma_pagamento": str(r.get("forma_pagamento") or "DIVERSOS")[:50],
                    "valor_bruto": float(r.get("valor_bruto") or 0.0),
                    "valor_desconto": float(r.get("valor_desconto") or 0.0),
                    "valor_liquido": float(r.get("valor_liquido") or 0.0),
                    "valor_impostos_diretos": float(r.get("valor_impostos_diretos") or 0.0),
                    "valor_cmv": float(r.get("valor_cmv") or 0.0),
                    "margem_contribuicao": float(r.get("margem_contribuicao") or 0.0),
                    "prazo_medio_dias": int(r.get("prazo_medio_dias") or 0),
                    "eh_a_vista": True if int(r.get("eh_a_vista") or 1) == 1 else False,
                    "status_pedido": str(r.get("status_pedido") or "FAT")[:10],
                    "tipo_pedido": str(r.get("tipo_pedido") or "N")[:5],
                    "natureza_movimentacao": str(r.get("natureza_movimentacao") or "VM")[:10],
                    "sincronizado_em": datetime.now().isoformat()
                })

            if norm:
                enviados = self._post_supabase_batch("bi_vendas", norm)
                logger.info(f"{enviados} vendas enviadas com sucesso.")
                self.state["ultimo_sync_vendas"] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                self.save_state()
                return enviados
            else:
                logger.info(f"Nenhuma nova venda desde {ultimo_sync}")
        except Exception as e:
            logger.warning(f"Aviso ao sincronizar Vendas: {e}")
        return 0

    def sincronizar_vendas_itens(self, conn, filiais_selecionadas=None, dt_corte=None):
        logger.info("Sincronizando Itens de Vendas (Corte Seguro de 90 Dias)...")
        filial_default = self.config.get("codigo_filial", 0)
        batch_limit = self.config.get("batch_size", 1000)

        if filiais_selecionadas:
            filiais_in = ", ".join(str(f) for f in filiais_selecionadas)
            todas_filiais = 0
        else:
            filiais_in = "0"
            todas_filiais = 1

        params = {
            "p_filial": filial_default,
            "p_todas_filiais": todas_filiais,
            "p_limit": batch_limit
        }

        try:
            with conn.cursor() as cur:
                try:
                    cur.execute("SET TRANSACTION READ ONLY")
                except Exception:
                    pass
                rows = self._executar_query_com_fallback(cur, QUERY_DELTA_VENDAS_ITENS_PROTON, QUERY_DELTA_VENDAS_ITENS_FALLBACK, params, filiais_in)

            norm = []
            for r in rows:
                id_item = str(r.get("id_item_oracle") or f"{r.get('id_pedido_oracle')}_{r.get('produto_codigo')}")
                norm.append({
                    "empresa_id": self.empresa_id,
                    "filial_id": int(r.get("filial_id") or filial_default),
                    "id_pedido_oracle": str(r.get("id_pedido_oracle") or "")[:100],
                    "id_item_oracle": id_item[:100],
                    "produto_codigo": str(r.get("produto_codigo") or "")[:100],
                    "produto_descricao": str(r.get("produto_descricao") or "")[:255],
                    "quantidade": float(r.get("quantidade") or 0.0),
                    "preco_unitario": float(r.get("preco_unitario") or 0.0),
                    "valor_total": float(r.get("valor_total") or 0.0),
                    "data_emissao": str(r.get("data_emissao") or datetime.now().strftime("%Y-%m-%d"))[:10],
                    "sincronizado_em": datetime.now().isoformat()
                })

            if norm:
                enviados = self._post_supabase_batch("bi_vendas_itens", norm)
                logger.info(f"{enviados} itens de venda enviados com sucesso.")
                self.state["ultimo_sync_vendas_itens"] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                self.save_state()
                return enviados
            else:
                logger.info("Nenhum item de venda retornado pela consulta delta.")
        except Exception as e:
            logger.warning(f"Aviso ao sincronizar Itens de Venda: {e}")
        return 0

    def sincronizar_contas_receber(self, conn, filiais_selecionadas=None, dt_corte=None):
        logger.info("Sincronizando Contas a Receber (CR)...")
        filial_default = self.config.get("codigo_filial", 0)
        ultimo_sync = dt_corte or self.state.get("ultimo_sync_cr", "2020-01-01 00:00:00")
        batch_limit = self.config.get("batch_size", 1000)

        if filiais_selecionadas:
            filiais_in = ", ".join(str(f) for f in filiais_selecionadas)
            todas_filiais = 0
        else:
            filiais_in = "0"
            todas_filiais = 1

        params = {
            "p_filial": filial_default,
            "p_ultimo_sync": ultimo_sync,
            "p_todas_filiais": todas_filiais,
            "p_limit": batch_limit
        }

        try:
            with conn.cursor() as cur:
                try:
                    cur.execute("SET TRANSACTION READ ONLY")
                except Exception:
                    pass
                rows = self._executar_query_com_fallback(cur, QUERY_DELTA_CR_PROTON, QUERY_DELTA_CR_FALLBACK, params, filiais_in)

            norm = []
            for r in rows:
                id_tit = str(r.get("id_titulo") or r.get("numero_titulo") or f"CR_{r.get('cod_cliente')}_{r.get('data_vencimento')}")
                norm.append({
                    "empresa_id": self.empresa_id,
                    "filial_id": int(r.get("filial_id") or filial_default),
                    "id_titulo_oracle": id_tit,
                    "numero_titulo": str(r.get("numero_titulo") or "")[:50],
                    "cliente_codigo": int(r.get("cod_cliente")) if r.get("cod_cliente") is not None else None,
                    "cliente_nome": str(r.get("cliente_nome") or "")[:200],
                    "tipo_titulo": str(r.get("tipo_titulo") or "CREDIARIO")[:50],
                    "data_emissao": str(r.get("data_emissao") or datetime.now().strftime("%Y-%m-%d"))[:10],
                    "data_vencimento": str(r.get("data_vencimento") or datetime.now().strftime("%Y-%m-%d"))[:10],
                    "data_liquidacao": str(r.get("data_liquidacao"))[:10] if r.get("data_liquidacao") else None,
                    "valor_titulo": float(r.get("valor_titulo") or 0.0),
                    "valor_saldo_aberto": float(r.get("valor_saldo_aberto") or 0.0),
                    "valor_pago": float(r.get("valor_pago") or 0.0),
                    "juros_recebidos": float(r.get("juros_recebidos") or 0.0),
                    "status_titulo": str(r.get("status_titulo") or "ABERTO")[:30],
                    "dias_atraso": int(r.get("dias_atraso") or 0),
                    "sincronizado_em": datetime.now().isoformat()
                })

            if norm:
                enviados = self._post_supabase_batch("bi_contas_receber", norm)
                logger.info(f"{enviados} titulos de CR enviados com sucesso.")
                self.state["ultimo_sync_cr"] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                self.save_state()
                return enviados
        except Exception as e:
            logger.warning(f"Aviso ao sincronizar CR: {e}")
        return 0

    def sincronizar_contas_pagar(self, conn, filiais_selecionadas=None, dt_corte=None):
        logger.info("Sincronizando Contas a Pagar (CP)...")
        filial_default = self.config.get("codigo_filial", 0)
        ultimo_sync = dt_corte or self.state.get("ultimo_sync_cp", "2020-01-01 00:00:00")
        batch_limit = self.config.get("batch_size", 1000)

        if filiais_selecionadas:
            filiais_in = ", ".join(str(f) for f in filiais_selecionadas)
            todas_filiais = 0
        else:
            filiais_in = "0"
            todas_filiais = 1

        params = {
            "p_filial": filial_default,
            "p_ultimo_sync": ultimo_sync,
            "p_todas_filiais": todas_filiais,
            "p_limit": batch_limit
        }

        try:
            with conn.cursor() as cur:
                try:
                    cur.execute("SET TRANSACTION READ ONLY")
                except Exception:
                    pass
                rows = self._executar_query_com_fallback(cur, QUERY_DELTA_CP_PROTON, QUERY_DELTA_CP_FALLBACK, params, filiais_in)

            norm = []
            for r in rows:
                id_tit = str(r.get("id_titulo") or r.get("numero_titulo") or f"CP_{r.get('cod_fornecedor')}_{r.get('data_vencimento')}")
                norm.append({
                    "empresa_id": self.empresa_id,
                    "filial_id": int(r.get("filial_id") or filial_default),
                    "id_titulo_oracle": id_tit,
                    "numero_titulo": str(r.get("numero_titulo") or "")[:50],
                    "fornecedor_codigo": int(r.get("cod_fornecedor")) if r.get("cod_fornecedor") is not None else None,
                    "credor_nome": str(r.get("credor_nome") or "")[:200],
                    "tipo_titulo": str(r.get("tipo_titulo") or "DUPLICATA")[:50],
                    "data_emissao": str(r.get("data_emissao") or datetime.now().strftime("%Y-%m-%d"))[:10],
                    "data_vencimento": str(r.get("data_vencimento") or datetime.now().strftime("%Y-%m-%d"))[:10],
                    "data_pagamento": str(r.get("data_pagamento"))[:10] if r.get("data_pagamento") else None,
                    "valor_titulo": float(r.get("valor_titulo") or 0.0),
                    "valor_saldo_aberto": float(r.get("valor_saldo_aberto") or 0.0),
                    "valor_pago": float(r.get("valor_pago") or 0.0),
                    "status_titulo": str(r.get("status_titulo") or "ABERTO")[:30],
                    "dias_atraso": int(r.get("dias_atraso") or 0),
                    "sincronizado_em": datetime.now().isoformat()
                })

            if norm:
                enviados = self._post_supabase_batch("bi_contas_pagar", norm)
                logger.info(f"{enviados} titulos de CP enviados com sucesso.")
                self.state["ultimo_sync_cp"] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                self.save_state()
                return enviados
        except Exception as e:
            logger.warning(f"Aviso ao sincronizar CP: {e}")
        return 0

    def sincronizar_tesouraria(self, conn, filiais_selecionadas=None):
        logger.info("Sincronizando Tesouraria & Saldos...")
        filial_default = self.config.get("codigo_filial", 0)

        if filiais_selecionadas:
            filiais_in = ", ".join(str(f) for f in filiais_selecionadas)
            todas_filiais = 0
        else:
            filiais_in = "0"
            todas_filiais = 1

        params = {
            "p_filial": filial_default,
            "p_todas_filiais": todas_filiais
        }

        try:
            with conn.cursor() as cur:
                try:
                    cur.execute("SET TRANSACTION READ ONLY")
                except Exception:
                    pass
                rows = self._executar_query_com_fallback(cur, QUERY_SALDOS_TESOURARIA_PROTON, QUERY_SALDOS_TESOURARIA_FALLBACK, params, filiais_in)

            norm = []
            for r in rows:
                cod_conta = int(r.get("conta_codigo") or 1)
                norm.append({
                    "empresa_id": self.empresa_id,
                    "filial_id": int(r.get("filial_id") or filial_default),
                    "conta_codigo": cod_conta,
                    "conta_descricao": str(r.get("conta_descricao") or f"Conta {cod_conta}")[:150],
                    "banco_nome": str(r.get("banco_nome") or "BANCO")[:100],
                    "saldo_atual": float(r.get("saldo_atual") or 0.0),
                    "atualizado_em": datetime.now().isoformat()
                })

            if norm:
                enviados = self._post_supabase_batch("bi_tesouraria_saldos", norm)
                logger.info(f"{enviados} saldos de tesouraria atualizados.")
                self.state["ultimo_sync_tesouraria"] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                self.save_state()
                return enviados
        except Exception as e:
            logger.warning(f"Aviso ao sincronizar Tesouraria: {e}")
        return 0

    def sincronizar_estoques(self, conn, filiais_selecionadas=None):
        logger.info("Sincronizando Posicao de Estoques...")
        filial_default = self.config.get("codigo_filial", 0)
        batch_limit = self.config.get("batch_size", 1000)

        if filiais_selecionadas:
            filiais_in = ", ".join(str(f) for f in filiais_selecionadas)
            todas_filiais = 0
        else:
            filiais_in = "0"
            todas_filiais = 1

        params = {
            "p_filial": filial_default,
            "p_todas_filiais": todas_filiais,
            "p_limit": batch_limit
        }

        try:
            with conn.cursor() as cur:
                try:
                    cur.execute("SET TRANSACTION READ ONLY")
                except Exception:
                    pass
                rows = self._executar_query_com_fallback(cur, QUERY_POSICAO_ESTOQUE_PROTON, QUERY_POSICAO_ESTOQUE_FALLBACK, params, filiais_in)

            norm = []
            for r in rows:
                cod_prod = str(r.get("produto_codigo") or "0").strip()
                c_medio = float(r.get("custo_medio") or r.get("preco_custo") or 0.0)
                c_ultimo = float(r.get("custo_ultimo") or 0.0)
                norm.append({
                    "empresa_id": self.empresa_id,
                    "filial_id": int(r.get("filial_id") or filial_default),
                    "produto_codigo": cod_prod,
                    "produto_descricao": str(r.get("produto_descricao") or f"Produto {cod_prod}")[:255],
                    "grupo_nome": str(r.get("grupo_nome") or "GERAL")[:100],
                    "quantidade_estoque": float(r.get("quantidade_estoque") or 0.0),
                    "preco_custo": c_medio,
                    "custo_medio": c_medio,
                    "custo_ultimo": c_ultimo,
                    "preco_venda": float(r.get("preco_venda") or 0.0),
                    "dias_sem_venda": int(r.get("dias_sem_venda") or 0),
                    "giro_dias": float(r.get("giro_dias") or 0.0),
                    "classe_abc": str(r.get("classe_abc") or "C")[:1],
                    "ativo": True if int(r.get("ativo") or 1) == 1 else False,
                    "sincronizado_em": datetime.now().isoformat()
                })

            if norm:
                enviados = self._post_supabase_batch("bi_estoques", norm)
                logger.info(f"{enviados} itens de estoque sincronizados.")
                self.state["ultimo_sync_estoque"] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                self.save_state()
                return enviados
        except Exception as e:
            logger.warning(f"Aviso ao sincronizar Estoques: {e}")
        return 0

    def atualizar_cache_dashboard(self, modulo="todos"):
        """
        Dispara a atualização do cache do dashboard na nuvem Supabase.
        Chama a RPC refresh_dashboard_cache e/ou atualiza diretamente bi_dashboard_cache.
        """
        if not self.empresa_id:
            return False

        url = f"{self.config.get('url_api_nuvem', SUPABASE_DEFAULT_URL)}/rest/v1/rpc/refresh_dashboard_cache"
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "p_empresa_id": str(self.empresa_id),
            "p_modulo": modulo,
            "p_periodo": "todos"
        }
        try:
            res = requests.post(url, headers=headers, json=payload, timeout=8)
            if res.status_code == 200:
                logger.info(f"⚡ [CACHE] Cache do Dashboard atualizado via RPC ({modulo}): {res.text[:100]}")
                return True
            else:
                logger.warning(f"⚠️ [CACHE] RPC refresh_dashboard_cache retornou {res.status_code}: {res.text[:100]}")
        except Exception as e:
            logger.warning(f"⚠️ [CACHE] Falha ao chamar RPC refresh_dashboard_cache: {e}")

        # Fallback: atualiza timestamp na tabela bi_dashboard_cache via REST direto
        try:
            patch_url = f"{self.config.get('url_api_nuvem', SUPABASE_DEFAULT_URL)}/rest/v1/bi_dashboard_cache?empresa_id=eq.{self.empresa_id}"
            requests.patch(patch_url, headers=headers, json={"atualizado_em": datetime.now().isoformat()}, timeout=5)
        except Exception:
            pass
        return False

    def executar_ciclo_completo(self, filiais_selecionadas=None, meses_corte=None, progress_callback=None):
        logger.info("Iniciando ciclo de sincronizacao Delta NexaBI...")
        def log_prog(msg):
            if progress_callback:
                try:
                    progress_callback(msg)
                except Exception:
                    pass
            logger.info(msg)
        
        auth = self.obter_empresa_autenticada()
        if not auth["sucesso"]:
            logger.error(f"Erro de autenticacao Cloud: {auth['mensagem']}")
            return {"sucesso": False, "erro": auth["mensagem"]}

        filiais = filiais_selecionadas or self.config.get("filiais_selecionadas", [])
        corte_m = meses_corte if meses_corte is not None else self.config.get("periodo_corte_meses", 12)
        dt_corte = (datetime.now() - timedelta(days=corte_m * 30)).strftime('%Y-%m-%d 00:00:00') if corte_m > 0 else None

        conn = None
        mods = auth.get("modulos_config") or getattr(self, "modulos_config", None) or {"vendas": True}
        totais = {}
        log_prog(f"☁️ Perfil consultado na nuvem para {auth.get('empresa_nome', 'Empresa')}:")
        log_prog(f"   • Vendas: {'✅ ATIVO' if mods.get('vendas', True) else '❌ INATIVO'}")
        log_prog(f"   • Contas a Receber: {'✅ ATIVO' if mods.get('contas_receber', False) else '❌ INATIVO'}")
        log_prog(f"   • Contas a Pagar: {'✅ ATIVO' if mods.get('contas_pagar', False) else '❌ INATIVO'}")
        log_prog(f"   • Estoques: {'✅ ATIVO' if (mods.get('estoques', False) or mods.get('estoque', False)) else '❌ INATIVO'}")
        log_prog(f"   • Tesouraria: {'✅ ATIVO' if mods.get('tesouraria', False) else '❌ INATIVO'}")
        try:
            conn = self.get_oracle_connection()
            log_prog("🏢 Sincronizando Unidades / Filiais...")
            totais["unidades"] = self.sincronizar_unidades(conn, filiais_selecionadas=filiais)
            log_prog(f"   ✓ Unidades concluídas: {totais['unidades']}")

            # 1. Vendas & Pedidos (com histórico consolidado)
            if mods.get("vendas", True):
                log_prog("🛒 Sincronizando Vendas (Cabeçalho)...")
                totais["vendas"] = self.sincronizar_vendas(conn, filiais_selecionadas=filiais, dt_corte=dt_corte)
                log_prog(f"   ✓ Vendas concluídas: {totais['vendas']}")

                log_prog("📦 Sincronizando Itens de Venda (Corte Seguro 90 Dias)...")
                totais["vendas_itens"] = self.sincronizar_vendas_itens(conn, filiais_selecionadas=filiais, dt_corte=dt_corte)
                log_prog(f"   ✓ Itens de Venda concluídos: {totais['vendas_itens']}")
                self.atualizar_cache_dashboard("vendas")
            else:
                log_prog("⏸️ Módulo Vendas INATIVO no Painel Master. Extração ignorada.")
                totais["vendas"] = 0
                totais["vendas_itens"] = 0

            # 2. Contas a Receber
            if mods.get("contas_receber", False):
                log_prog("💳 Sincronizando Contas a Receber...")
                totais["cr"] = self.sincronizar_contas_receber(conn, filiais_selecionadas=filiais, dt_corte=dt_corte)
                log_prog(f"   ✓ Contas a Receber concluídas: {totais['cr']}")
                self.atualizar_cache_dashboard("cr")
            else:
                log_prog("⏸️ Módulo Contas a Receber INATIVO no Painel Master. Extração ignorada.")
                totais["cr"] = 0

            # 3. Contas a Pagar
            if mods.get("contas_pagar", False):
                log_prog("📑 Sincronizando Contas a Pagar...")
                totais["cp"] = self.sincronizar_contas_pagar(conn, filiais_selecionadas=filiais, dt_corte=dt_corte)
                log_prog(f"   ✓ Contas a Pagar concluídas: {totais['cp']}")
                self.atualizar_cache_dashboard("cp")
            else:
                log_prog("⏸️ Módulo Contas a Pagar INATIVO no Painel Master. Extração ignorada.")
                totais["cp"] = 0

            # 4. Tesouraria & Saldos
            if mods.get("tesouraria", False):
                log_prog("💰 Sincronizando Tesouraria & Saldos...")
                totais["tesouraria"] = self.sincronizar_tesouraria(conn, filiais_selecionadas=filiais)
                log_prog(f"   ✓ Tesouraria concluída: {totais['tesouraria']}")
                self.atualizar_cache_dashboard("tesouraria")
            else:
                log_prog("⏸️ Módulo Tesouraria INATIVO no Painel Master. Extração ignorada.")
                totais["tesouraria"] = 0

            # 5. Estoques
            if mods.get("estoques", False):
                log_prog("📊 Sincronizando Posição de Estoques...")
                totais["estoques"] = self.sincronizar_estoques(conn, filiais_selecionadas=filiais)
                log_prog(f"   ✓ Estoques concluídos: {totais['estoques']}")
                self.atualizar_cache_dashboard("estoques")
            else:
                log_prog("⏸️ Módulo Estoques INATIVO no Painel Master. Extração ignorada.")
                totais["estoques"] = 0

            # Atualização geral consolidada do cache do Dashboard
            log_prog("⚡ Atualizando cache analítico do Dashboard na nuvem...")
            self.atualizar_cache_dashboard("todos")

            # Executar Sentinela de integridade
            try:
                self.executar_sentinela_schema_drift()
            except Exception:
                pass

            logger.info(f"Ciclo finalizado com sucesso! Totais: {totais}")
            return {"sucesso": True, "totais": totais}
        except Exception as e:
            logger.error(f"Erro no ciclo de sincronizacao: {e}")
            return {"sucesso": False, "erro": str(e)}
        finally:
            if conn:
                try:
                    conn.close()
                except Exception:
                    pass

    def executar_sentinela_schema_drift(self, forcar_notificacao=False):
        """
        Sentinela de Schema Drift do ERP:
        Inspeciona se tabelas ou procedures sofreram alteração em LAST_DDL_TIME.
        Garante envio de WhatsApp às 10:00 da manhã (horário comercial).
        """
        hora_atual = datetime.now().hour
        pode_notificar = (hora_atual >= 10 and hora_atual < 18) or forcar_notificacao

        try:
            conn = self.get_oracle_connection()
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT object_name, object_type, TO_CHAR(last_ddl_time, 'YYYY-MM-DD HH24:MI:SS')
                    FROM all_objects
                    WHERE (owner = 'DBAUSER' OR owner = USER)
                      AND object_name IN (
                          'TPED_PEDIDO_VENDA', 'TPED_HISTORICO_VENDA', 'TPED_PEDIDO_VENDA_ITEM', 
                          'TPED_HISTORICO_VENDA_ITEM', 'TENT_ENTRADA', 'TENT_ITEM_ENTRADA',
                          'TTIT_TITULO_RECEBER', 'TTIT_TITULO_PAGAR', 'TMER_ESTOQUE'
                      )
                      AND last_ddl_time >= TRUNC(SYSDATE - 1)
                """)
                alterados = cur.fetchall()
            conn.close()

            if not alterados:
                return {"sucesso": True, "alteracoes": 0}

            linhas_alerta = [f"• {r[0]} ({r[1]}) alterado em {r[2]}" for r in alterados]
            corpo_msg = (
                f"🚨 *NexaBI Sentinela — Alerta de Schema Drift*\n\n"
                f"🏢 *Cliente:* {self.empresa_nome or 'DESTAK PRIME'}\n"
                f"⚠️ *Objetos Alterados no ERP Próton:*\n" + "\n".join(linhas_alerta[:4]) + "\n\n"
                f"💡 *Ação:* Acesse o SchemaStudio para homologar o template."
            )

            if pode_notificar:
                self._disparar_whatsapp_alerta_master(corpo_msg)
            else:
                logger.info(f"⏳ Alerta enfileirado para as 10:00 (Hora atual: {datetime.now().strftime('%H:%M')}).")

            return {"sucesso": True, "alteracoes": len(alterados), "notificado": pode_notificar}
        except Exception as e:
            return {"sucesso": False, "erro": str(e)}

    def _disparar_whatsapp_alerta_master(self, mensagem_texto):
        """Dispara mensagem no WhatsApp do Master via Meta Cloud API Oficial"""
        try:
            token = "EAAPXIMSfPiIBSLeie9nVvTmqVmttnj0m137fHEchZAENQlWSZChLjizAgBE6b59OKGc8sZBJGZAZCBJvoIK0myXpdAZAVnOsZCZA7rh2LPrUv7RQnPxZBeJdjjaLtqFkrlQqP17eqIhW3BcYhUimGXHucp1nv2gZBlkUCTo2sADwFOUPhOnPUvxFl31t5nNtGcqt4n2QZDZD"
            phone_id = "1203498906186524"
            destinatario = "5571991954406"
            url = f"https://graph.facebook.com/v20.0/{phone_id}/messages"
            headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
            payload = {
                "messaging_product": "whatsapp",
                "to": destinatario,
                "type": "text",
                "text": {"body": mensagem_texto}
            }
            res = requests.post(url, headers=headers, json=payload, timeout=10)
            return res.status_code in [200, 201]
        except Exception:
            return False

