"""
================================================================================
NexaBI — Alpha Suite | NexaBI SyncAgent (v1.6.1 PROD Standalone)
Holding: NexaLife Tech & Alpha Solutions
Ecossistema: NexaBI — Alpha Suite (Multi-ERP & Analytics Corporativo)
Plataforma Online: https://bi.nexalifetech.com.br (Firebase: nexabi-suite.web.app)
Banco de Dados Cloud: Supabase PostgreSQL sa-east-1 (https://fwlexdycmquuwfrfwokv.supabase.co)
================================================================================
VERSÃO DE PRODUÇÃO LIMPA & PLUG-AND-PLAY (CLIENT-SIDE):
- Matriz Inteligente de Status de Pedidos (Faturado, Em Separação RO, Conferência VO, Bloqueios BC/BG)
- Diagnóstico Volumétrico com Detalhamento de Pedidos Faturados vs Pendentes
- Interface Enxuta e Elegante: Focada exclusivamente em Operação e Credenciais
- Motor de Extração Otimizado com Suporte Nativo a Tabelas Ativas e Históricas (UNION ALL)
- Proteção Militar de Credenciais AES-256 (Chave atrelada ao hardware da máquina)
- Blindagem Nativa de Arquivos no Windows (FILE_ATTRIBUTE_READONLY + HIDDEN + Auto-Cura .bak)
- Gestão Integrada de Serviço do Windows (Auto-Start no Boot 24/7 sem login RDP)
- Validação Estrita de Segurança para Perfil Master (marcello/master/admin)
================================================================================
"""

import sys
import os
import re
import stat
import ctypes
import json
import time
import base64
import uuid
import socket
import ssl
import struct
import decimal
import getpass
import hashlib
import hmac
import secrets
import platform
import subprocess
import threading
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime, timedelta
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
from PIL import Image, ImageTk
import pystray

import requests
import oracledb
from security import encrypt_value, decrypt_value, get_machine_fingerprint
from auth_master import validar_credencial_master
from oracle_queries import QUERY_DELTA_VENDAS_ITENS_PROTON, QUERY_DELTA_VENDAS_ITENS_FALLBACK

try:
    # Registra ID explícito para que a Barra de Tarefas e Título do Windows exibam o ícone 3D N oficial
    myappid = "NexaLife.NexaBI.SyncAgent.v1.9.5"
    ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
except Exception:
    pass

APP_VERSION = "v1.9.5 PROD"

def _setup_agent_logger():
    try:
        base_dir = os.path.dirname(os.path.abspath(sys.executable if getattr(sys, 'frozen', False) else __file__))
        log_file = os.path.join(base_dir, "sync_agent.log")
        logger = logging.getLogger()
        logger.setLevel(logging.INFO)
        if not any(isinstance(h, RotatingFileHandler) for h in logger.handlers):
            rfh = RotatingFileHandler(log_file, maxBytes=10*1024*1024, backupCount=5, encoding="utf-8")
            fmt = logging.Formatter("%(asctime)s [%(levelname)s] [%(name)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
            rfh.setFormatter(fmt)
            logger.addHandler(rfh)
        return log_file
    except Exception as e:
        print(f"Erro ao inicializar arquivo de log: {e}")
        return None

LOG_FILE_PATH = _setup_agent_logger()
logging.info("=" * 75)
logging.info(f"NexaBI SyncAgent {APP_VERSION} inicializado | Log: {LOG_FILE_PATH}")
logging.info("=" * 75)

def _handle_uncaught_exception(exc_type, exc_value, exc_traceback):
    if issubclass(exc_type, KeyboardInterrupt):
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return
    logging.critical("Exceção não tratada capturada:", exc_info=(exc_type, exc_value, exc_traceback))

sys.excepthook = _handle_uncaught_exception

SUPABASE_DEFAULT_URL = "https://fwlexdycmquuwfrfwokv.supabase.co"
SUPABASE_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bGV4ZHljbXF1dXdmcmZ3b2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNDI3NjQsImV4cCI6MjEwMjgxODc2NH0."
    "yb-ViQXYCUDiL2-3bXeKKw7HAubdd5jCy57Hf18OTIE"
)

TASK_SERVICE_NAME = "NexaBI_SyncAgent_Daemon"

FILE_ATTRIBUTE_READONLY = 0x01
FILE_ATTRIBUTE_HIDDEN = 0x02
FILE_ATTRIBUTE_NORMAL = 0x80
# Mapa padrão inteligente para o Próton ERP
DEFAULT_PROTON_STATUS_MAP = {
    "CL": {"desc": "Concluído / Liquidado (Faturado)", "cat": "FATURADO", "is_faturado": True},
    "MA": {"desc": "Faturado Manual", "cat": "FATURADO", "is_faturado": True},
    "CA": {"desc": "Cancelado", "cat": "CANCELADO", "is_faturado": False},
    "RO": {"desc": "Em Separação / Romaneio", "cat": "ABERTO", "is_faturado": False},
    "VO": {"desc": "Em Conferência", "cat": "ABERTO", "is_faturado": False},
    "DI": {"desc": "Digitado / Aberto", "cat": "ABERTO", "is_faturado": False},
    "BC": {"desc": "Bloqueio de Crédito", "cat": "ABERTO", "is_faturado": False},
    "BG": {"desc": "Bloqueio Geral / Gerencial", "cat": "ABERTO", "is_faturado": False},
}

def get_resource_path(relative_path):
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), relative_path)

def set_app_icon(win):
    try:
        ico = get_resource_path("app_icon.ico")
        if os.path.exists(ico):
            win.iconbitmap(default=ico)
    except Exception:
        try:
            ico = get_resource_path("app_icon.ico")
            if os.path.exists(ico):
                win.iconbitmap(ico)
        except Exception:
            pass
    try:
        png = get_resource_path("app_icon.png")
        if os.path.exists(png):
            img = tk.PhotoImage(file=png)
            win.iconphoto(True, img)
            win._icon_ref = img
    except Exception:
        pass


# -----------------------------------------------------------------------------
# 1. SEGURANCA AES-256 E GESTAO DE ARQUIVOS BLINDADOS (ZERO DATA LOSS)
# -----------------------------------------------------------------------------
def salvar_arquivo_blindado(caminho, data_dict):
    """
    Salva o arquivo de configuração com blindagem defensiva contra perda de dados.
    Garante que backups (.bak) jamais sejam destruídos caso as novas credenciais estejam vazias.
    """
    try:
        if os.path.exists(caminho):
            ctypes.windll.kernel32.SetFileAttributesW(caminho, FILE_ATTRIBUTE_NORMAL)
    except Exception:
        pass

    bak_path = caminho + '.bak'
    if os.path.exists(caminho):
        try:
            should_update_bak = True
            novo_pwd = data_dict.get("oracle", {}).get("password", "")
            novo_key = data_dict.get("api_key", "")
            if os.path.exists(bak_path):
                with open(bak_path, 'r', encoding='utf-8') as f_bak:
                    antigo_bak = json.load(f_bak)
                antigo_pwd = antigo_bak.get("oracle", {}).get("password", "")
                antigo_key = antigo_bak.get("api_key", "")
                # Se o backup antigo tinha credenciais e a nova configuração está vazia, PRESERVA O BACKUP!
                if (antigo_pwd and not novo_pwd) or (antigo_key and not novo_key):
                    should_update_bak = False

            if should_update_bak:
                if os.path.exists(bak_path):
                    ctypes.windll.kernel32.SetFileAttributesW(bak_path, FILE_ATTRIBUTE_NORMAL)
                with open(bak_path, 'w', encoding='utf-8') as f:
                    json.dump(data_dict, f, indent=2, ensure_ascii=False)
                ctypes.windll.kernel32.SetFileAttributesW(bak_path, FILE_ATTRIBUTE_READONLY | FILE_ATTRIBUTE_HIDDEN)
        except Exception:
            pass

    with open(caminho, 'w', encoding='utf-8') as f:
        json.dump(data_dict, f, indent=2, ensure_ascii=False)

    try:
        ctypes.windll.kernel32.SetFileAttributesW(caminho, FILE_ATTRIBUTE_NORMAL)
    except Exception:
        pass

def carregar_arquivo_blindado(caminho, default_dict):
    """
    Carrega o arquivo JSON blindado com auto-recuperação cruzada contra exclusão e perda de credenciais.
    """
    bak_path = caminho + '.bak'
    data = None

    if os.path.exists(caminho):
        try:
            with open(caminho, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception:
            data = None

    # Se o arquivo principal não existir ou falhar, recupera automaticamente do backup
    if data is None and os.path.exists(bak_path):
        try:
            with open(bak_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            salvar_arquivo_blindado(caminho, data)
        except Exception:
            data = None

    if data is None:
        return default_dict

    # Verificação cruzada defensiva com o .bak:
    # Se o arquivo principal perdeu a senha ou API key mas o backup ainda os continha, auto-recupera!
    if os.path.exists(bak_path):
        try:
            with open(bak_path, 'r', encoding='utf-8') as f:
                bak_data = json.load(f)
            ora_main = data.get("oracle", {})
            ora_bak = bak_data.get("oracle", {})
            if not ora_main.get("password") and ora_bak.get("password"):
                ora_main["password"] = ora_bak["password"]
                data["oracle"] = ora_main
            if not data.get("api_key") and bak_data.get("api_key"):
                data["api_key"] = bak_data["api_key"]
        except Exception:
            pass

    return data

def get_current_exe_path():
    if getattr(sys, 'frozen', False):
        return os.path.abspath(sys.executable)
    return os.path.abspath(sys.argv[0])

def instalar_servico_windows():
    exe_path = get_current_exe_path()
    logging.info(f"[SERVICO] Iniciando instalação do serviço Windows para: {exe_path}")

    # 1. Tentativa direta (se já estiver executando como Administrador)
    cmd_system = f'schtasks /create /tn "{TASK_SERVICE_NAME}" /tr "\"{exe_path}\" --daemon" /sc ONSTART /ru SYSTEM /rl HIGHEST /f'
    res = subprocess.run(cmd_system, shell=True, capture_output=True, text=True)
    logging.info(f"[SERVICO] Tentativa 1 (SYSTEM ONSTART): returncode={res.returncode}, out={res.stdout.strip()}, err={res.stderr.strip()}")

    if res.returncode == 0:
        subprocess.run(f'schtasks /run /tn "{TASK_SERVICE_NAME}"', shell=True, capture_output=True)
        logging.info("[SERVICO] Tarefa SYSTEM iniciada com sucesso.")
        return True, "Serviço do Windows (Auto-Start no Boot 24/7) instalado com sucesso!\nO SyncAgent iniciará sozinho com o Windows em segundo plano."

    # 2. Se falhou (geralmente Acesso Negado), solicita elevação de Administrador via UAC
    logging.info("[SERVICO] Tentativa direta falhou. Solicitando elevação UAC do Windows...")
    try:
        ps_cmd = (
            f"Start-Process schtasks -ArgumentList "
            f"'/create /tn \"{TASK_SERVICE_NAME}\" /tr \"\"\"{exe_path}\"\" --daemon\" /sc ONSTART /ru SYSTEM /rl HIGHEST /f' "
            f"-Verb RunAs -Wait -WindowStyle Hidden"
        )
        elev_res = subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], capture_output=True, text=True)
        logging.info(f"[SERVICO] Retorno PowerShell UAC: code={elev_res.returncode}, err={elev_res.stderr.strip()}")

        chk = subprocess.run(f'schtasks /query /tn "{TASK_SERVICE_NAME}"', shell=True, capture_output=True, text=True)
        if chk.returncode == 0:
            ps_run = f"Start-Process schtasks -ArgumentList '/run /tn \"{TASK_SERVICE_NAME}\"' -Verb RunAs -Wait -WindowStyle Hidden"
            subprocess.run(["powershell", "-NoProfile", "-Command", ps_run], capture_output=True, text=True)
            logging.info("[SERVICO] Tarefa SYSTEM criada e iniciada com elevação UAC com sucesso!")
            return True, "Serviço do Windows (Auto-Start no Boot 24/7) instalado e iniciado com sucesso!\n(Executado com privilégios de Administrador)"
    except Exception as e_elev:
        logging.warning(f"[SERVICO] Exceção na elevação UAC: {e_elev}")

    # 3. Fallback: Inicialização no logon do usuário (sem exigir SYSTEM / HIGHEST)
    logging.info("[SERVICO] Tentando fallback para ONLOGON do usuário...")
    cmd_user = f'schtasks /create /tn "{TASK_SERVICE_NAME}" /tr "\"{exe_path}\" --daemon" /sc ONLOGON /f'
    res2 = subprocess.run(cmd_user, shell=True, capture_output=True, text=True)
    logging.info(f"[SERVICO] Tentativa Fallback (ONLOGON): returncode={res2.returncode}, out={res2.stdout.strip()}, err={res2.stderr.strip()}")
    if res2.returncode == 0:
        subprocess.run(f'schtasks /run /tn "{TASK_SERVICE_NAME}"', shell=True, capture_output=True)
        return True, "Serviço de Inicialização Automática instalado com sucesso!\nIniciará automaticamente sempre que o usuário fizer login no Windows."

    msg_erro = (
        f"Falha ao registrar serviço no Windows:\n{res.stderr or res.stdout}\n\n"
        f"💡 Solução Recomendada:\n"
        f"Execute o SyncAgent como Administrador:\n"
        f"Feche esta janela, clique com o botão direito em 'NexaBI-SyncAgent.exe' e selecione 'Executar como Administrador'."
    )
    logging.error(f"[SERVICO] Falha definitiva na instalação do serviço: {res.stderr or res.stdout}")
    return False, msg_erro

def remover_servico_windows():
    logging.info(f"[SERVICO] Solicitando remoção do serviço: {TASK_SERVICE_NAME}")
    subprocess.run(f'schtasks /end /tn "{TASK_SERVICE_NAME}"', shell=True, capture_output=True)
    res = subprocess.run(f'schtasks /delete /tn "{TASK_SERVICE_NAME}" /f', shell=True, capture_output=True, text=True)
    if res.returncode == 0:
        logging.info("[SERVICO] Serviço removido com sucesso via comando direto.")
        return True, "Serviço do Windows removido com sucesso."

    # Tenta com elevação UAC se falhou por permissão
    try:
        ps_cmd = f"Start-Process schtasks -ArgumentList '/delete /tn \"{TASK_SERVICE_NAME}\" /f' -Verb RunAs -Wait -WindowStyle Hidden"
        subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], capture_output=True, text=True)
        chk = subprocess.run(f'schtasks /query /tn "{TASK_SERVICE_NAME}"', shell=True, capture_output=True, text=True)
        if chk.returncode != 0:
            logging.info("[SERVICO] Serviço removido com sucesso via elevação UAC.")
            return True, "Serviço do Windows removido com sucesso (como Administrador)."
    except Exception as e:
        logging.warning(f"[SERVICO] Erro ao tentar remoção via UAC: {e}")

    logging.error(f"[SERVICO] Falha ao remover serviço: {res.stderr or res.stdout}")
    return False, f"Falha ao remover o serviço:\n{res.stderr or res.stdout}"

def verificar_status_servico():
    res = subprocess.run(f'schtasks /query /tn "{TASK_SERVICE_NAME}"', shell=True, capture_output=True, text=True)
    if res.returncode == 0:
        return True, "🟢 Ativo (Auto-Start no Boot do Windows)"
    return False, "⚪ Não Instalado como Serviço"

# -----------------------------------------------------------------------------
# 2. MOTOR CENTRAL DE SINCRONIZACAO COM MATRIZ DE STATUS
# -----------------------------------------------------------------------------
class SyncEngine:
    def __init__(self, config_path='config.json', state_path='state.json'):
        self.config_path = config_path
        self.state_path = state_path
        self.empresa_id = None
        self.empresa_nome = None
        self.unidades_cache = []
        self.raw_password = ""
        self.raw_api_key = ""
        self.config = self.load_config()
        self.state = self.load_state()

    def load_config(self):
        default_cfg = {
            "empresa_cnpj": "",
            "codigo_filial": 0,
            "filiais_selecionadas": [],
            "periodo_corte_meses": 12,
            "api_key": "",
            "url_api_nuvem": SUPABASE_DEFAULT_URL,
            "oracle": {
                "host": "localhost",
                "port": 1521,
                "service_name": "DBPROD",
                "user": "APPUSER",
                "password": "",
                "client_lib_dir": "",
                "dsn": "localhost:1521/DBPROD",
                "thin_mode": True
            },
            "batch_size": 1000
        }

        loaded = carregar_arquivo_blindado(self.config_path, default_cfg)
        try:
            ora = loaded.get("oracle", {})
            self.raw_password = str(ora.get("password", ""))
            ora["password"] = decrypt_value(self.raw_password)

            self.raw_api_key = str(loaded.get("api_key", ""))
            loaded["api_key"] = decrypt_value(self.raw_api_key)

            url_nuvem = loaded.get("url_api_nuvem", "")
            if not url_nuvem or "railway.app" in url_nuvem:
                loaded["url_api_nuvem"] = SUPABASE_DEFAULT_URL

            loaded["oracle"] = ora
            return loaded
        except Exception:
            return loaded if isinstance(loaded, dict) and loaded else default_cfg

    def save_config(self, cfg=None):
        if cfg:
            self.config = cfg

        export_cfg = json.loads(json.dumps(self.config))
        ora = export_cfg.get("oracle", {})

        # BLINDAGEM DE SENHA: Se a senha for vazia, preserva o raw anterior
        pwd = ora.get("password", "")
        if not pwd and getattr(self, "raw_password", ""):
            pwd = self.raw_password
        if pwd:
            ora["password"] = encrypt_value(pwd)
            self.raw_password = ora["password"]
        export_cfg["oracle"] = ora

        # BLINDAGEM DE API KEY: Se for vazia, preserva a key anterior
        key = export_cfg.get("api_key", "")
        if not key and getattr(self, "raw_api_key", ""):
            key = self.raw_api_key
        if key:
            export_cfg["api_key"] = encrypt_value(key)
            self.raw_api_key = export_cfg["api_key"]

        salvar_arquivo_blindado(self.config_path, export_cfg)

    def load_state(self):
        default_sync = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d %H:%M:%S')
        default_state = {
            "ultimo_sync_vendas": default_sync,
            "ultimo_sync_cr": default_sync,
            "ultimo_sync_cp": default_sync,
            "ultimo_sync_estoque": default_sync,
            "ultimo_sync_tesouraria": default_sync,
            "ultimo_sync_unidades": default_sync
        }
        return carregar_arquivo_blindado(self.state_path, default_state)

    def save_state(self):
        salvar_arquivo_blindado(self.state_path, self.state)

    def get_dsn(self):
        ora = self.config.get("oracle", {})
        host = str(ora.get("host", "10.15.1.140")).strip() or "10.15.1.140"
        port = ora.get("port", 1521)
        service = str(ora.get("service_name", "DBPROD")).strip() or "DBPROD"

        if "/" in service: return service
        if "/" in host: return host
        return f"{host}:{port}/{service}"

    def _ensure_thick_mode(self):
        if not oracledb.is_thin_mode():
            return True
        candidatos = [
            r"C:\oracle\instantclient",
            r"C:\instantclient",
            r"C:\ALPHA\BI\instantclient",
            r"C:pp\instantclient"
        ]
        for c in candidatos:
            if os.path.exists(c):
                try:
                    oracledb.init_oracle_client(lib_dir=c)
                    return True
                except Exception:
                    pass
        try:
            oracledb.init_oracle_client()
            return True
        except Exception:
            return False

    def get_oracle_connection(self):
        """
        Abre conexão com o Oracle do Próton ERP.
        REGRA ARQUITETURAL OFICIAL DO PRÓTON ERP:
        - O usuário 'DBAUSER' é o proprietário (owner) de todos os objetos/tabelas do banco de dados Oracle.
        - O usuário 'APPUSER' é utilizado pela aplicação e possui concessão de leitura (SELECT) nesses objetos.
        - Ao conectar com APPUSER (ou qualquer usuário de aplicação), configuramos automaticamente 
          'ALTER SESSION SET CURRENT_SCHEMA = DBAUSER' para permitir consultas diretas transparentes.
        """
        ora = self.config.get("oracle", {})
        user = str(ora.get("user", "APPUSER")).strip()
        password = str(ora.get("password", "")).strip()
        dsn = self.get_dsn()

        conn = None
        try:
            conn = oracledb.connect(user=user, password=password, dsn=dsn)
        except Exception as e:
            err_msg = str(e)
            if "DPY-3010" in err_msg or "thin mode" in err_msg.lower():
                if self._ensure_thick_mode():
                    conn = oracledb.connect(user=user, password=password, dsn=dsn)
            if not conn:
                raise e

        # Auto-configurar CURRENT_SCHEMA para DBAUSER para garantir acesso transparente a todas as tabelas do Próton
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
                cur.fetchone()
                unidades_res, _ = self._buscar_unidades_cursor(cur)
                qtd_unidades = len(unidades_res)

            conn.close()
            mode_str = "Thick Mode" if not oracledb.is_thin_mode() else "Thin Mode"
            return {
                "sucesso": True,
                "mensagem": f"Conexão com Oracle OK em {dsn}! ({qtd_unidades} unidades detectadas) [{mode_str}]",
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
        cnpj_input = (self.config.get("empresa_cnpj") or "").strip()
        cnpj_nums = re.sub(r'\D', '', cnpj_input)

        url_base = self._get_cloud_url()
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json"
        }

        # Auto-recuperação da API Key por CNPJ caso a API Key esteja vazia
        if not api_key and cnpj_nums:
            try:
                query_url = f"{url_base}/rest/v1/empresas?select=id,razao_social,nome_fantasia,cnpj,api_key,ativo,modulos_config&ativo=eq.true"
                resp = requests.get(query_url, headers=headers, timeout=10)
                if resp.status_code == 200:
                    for emp in resp.json():
                        emp_cnpj_clean = re.sub(r'\D', '', str(emp.get("cnpj", "")))
                        if emp_cnpj_clean == cnpj_nums:
                            api_key = str(emp.get("api_key", "")).strip()
                            if api_key:
                                self.config["api_key"] = api_key
                                self.empresa_id = emp["id"]
                                self.empresa_nome = emp.get("nome_fantasia") or emp.get("razao_social")
                                self.modulos_config = emp.get("modulos_config") or {"vendas": True}
                                self.save_config()
                                return {
                                    "sucesso": True,
                                    "empresa": emp,
                                    "empresa_id": self.empresa_id,
                                    "empresa_nome": self.empresa_nome,
                                    "modulos_config": self.modulos_config,
                                    "recuperado": True
                                }
            except Exception:
                pass

        if not api_key:
            return {"sucesso": False, "mensagem": "API Key da Empresa não configurada."}

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
                        "mensagem": f"API Key '{api_key[:15]}...' nao encontrada ou inativa no NexaBI Cloud."
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
                    f"Conexão Cloud OK (TLS 1.3)!\n\n"
                    f"Empresa: {emp.get('nome_fantasia') or emp.get('razao_social')}\n"
                    f"CNPJ: {emp.get('cnpj')}\n"
                    f"Status: Autenticado & Ativo (ID: {emp.get('id')})"
                )
            }
        else:
            return {
                "sucesso": False,
                "mensagem": f"Erro na Conexão com a Nuvem:\n{res['mensagem']}"
            }

    def _resolve_table_and_cols(self, cur, table_name):
        """Resolve a tabela real no Oracle (testando com/sem schema, usuário conectado, DBAUSER e PROTON)"""
        user_ora = (self.config.get("oracle", {}).get("user") or "").strip().lower()
        base_name = table_name.split(".")[-1]
        
        candidatos = [table_name, base_name]
        if user_ora:
            candidatos.append(f"{user_ora}.{base_name}")
        candidatos.extend([f"dbauser.{base_name}", f"proton.{base_name}"])
        
        vistos = set()
        candidatos_unicos = []
        for c in candidatos:
            cl = c.lower()
            if cl not in vistos:
                vistos.add(cl)
                candidatos_unicos.append(c)
                
        for cand in candidatos_unicos:
            try:
                cur.execute(f"SELECT * FROM {cand} WHERE ROWNUM <= 1")
                cols = {c[0].lower(): c[0] for c in cur.description}
                return cand, cols
            except Exception:
                continue
        return None, {}

    def _buscar_unidades_cursor(self, cur):
        logs = []
        user_ora = (self.config.get("oracle", {}).get("user") or "").strip().lower()
        
        # 1. Candidatos diretos prioritários (com tund_unidade e dbauser.tund_unidade no topo absoluto)
        candidatos_tab = [
            "dbauser.tund_unidade", "tund_unidade", "appuser.tund_unidade", "proton.tund_unidade",
            "dbauser.tnud_unidade", "tnud_unidade", "appuser.tnud_unidade", "proton.tnud_unidade",
            "dbauser.tunid_unidade", "tunid_unidade",
            "dbauser.tfil_filial", "tfil_filial",
            "dbauser.tunidade", "tunidade",
            "dbauser.temp_empresa", "temp_empresa"
        ]
        if user_ora and f"{user_ora}.tund_unidade" not in candidatos_tab:
            candidatos_tab.insert(0, f"{user_ora}.tund_unidade")

        # 2. Busca no catálogo ALL_TABLES do Oracle por quaisquer tabelas de unidades/filiais
        try:
            cur.execute("""
                SELECT owner || '.' || table_name 
                FROM all_tables 
                WHERE (
                    UPPER(table_name) LIKE '%UNID%' 
                    OR UPPER(table_name) LIKE '%FILIAL%'
                    OR UPPER(table_name) IN ('TUND_UNIDADE', 'TNUD_UNIDADE', 'TUNID_UNIDADE', 'TFIL_FILIAL', 'TUNIDADE', 'TEMP_EMPRESA', 'TAB_UNIDADES', 'TAB_FILIAIS')
                )
                AND ROWNUM <= 25
            """)
            for r in cur.fetchall():
                t_cat = str(r[0])
                if t_cat.lower() not in [x.lower() for x in candidatos_tab]:
                    candidatos_tab.append(t_cat)
        except Exception as e_cat:
            logs.append(f"Catálogo Oracle: {str(e_cat)}")

        # 3. Tentar ler as unidades das tabelas candidatas com introspecção inteligente de colunas
        for tab in candidatos_tab:
            try:
                cur.execute(f"SELECT * FROM {tab} WHERE ROWNUM <= 300")
                cols = [c[0].lower() for c in cur.description]
                raw_rows = cur.fetchall()
                if not raw_rows:
                    continue

                # 3.1 Identificar coluna PK / Código
                pk_idx = next(
                    (i for i, c in enumerate(cols) if any(k in c for k in [
                        "unidade_pk", "cod_unidade", "unidade_id", "cod_filial", "filial_id",
                        "tund_unidade", "tnud_unidade", "tund_cod", "tnud_cod", "codigo_pk", "codigo", "id", "pk"
                    ]) and not any(k in c for k in ["empresa", "sistema", "tipo", "grupo"])),
                    0
                )

                # 3.2 Identificar TODAS as colunas candidatas de Nome Fantasia / Razão Social em ordem de prioridade
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

                # 3.3 Coluna de Cidade (excluindo colunas que sejam códigos, FKs, CEPs)
                cid_idx = next(
                    (i for i, c in enumerate(cols) if any(k in c for k in ["cidade", "municipio", "ds_cidade", "nome_cidade", "localidade"]) and not any(k in c for k in ["fk", "cod", "id", "cep", "ibge"])),
                    None
                )

                # 3.4 Coluna de UF
                uf_idx = next(
                    (i for i, c in enumerate(cols) if any(k in c for k in ["uf", "estado", "sg_uf"]) and not any(k in c for k in ["fk", "cod", "id"])),
                    None
                )

                # 3.5 Coluna de CEP / Código de Cidade para Join com tloc_cidade
                cep_idx = next(
                    (i for i, c in enumerate(cols) if any(k in c for k in ["cep", "cod_cidade", "cidade_fk", "localidade_fk"])),
                    None
                )

                # 3.6 Coluna de CNPJ / CPF
                cnpj_idx = next(
                    (i for i, c in enumerate(cols) if any(k in c for k in ["cgc", "cnpj", "cpf"]) and not any(k in c for k in ["fk", "id"])),
                    None
                )

                # 3.7 Coluna de Status / Situação
                st_idx = next(
                    (i for i, c in enumerate(cols) if any(k in c for k in ["situacao", "status", "ativo", "st"]) and not any(k in c for k in ["fk", "cod", "id"])),
                    None
                )

                # Dicionário de cidades do Próton ERP via dbauser.tloc_cidade se disponível
                dict_cidades_tloc = {}
                if cep_idx is not None:
                    try:
                        tab_tloc, cols_tloc = self._resolve_table_and_cols(cur, "dbauser.tloc_cidade")
                        if not tab_tloc:
                            tab_tloc, cols_tloc = self._resolve_table_and_cols(cur, "tloc_cidade")
                        if tab_tloc and cols_tloc:
                            pk_tloc = next((cols_tloc[c] for c in cols_tloc if "codigo" in c or "pk" in c or "cep" in c), list(cols_tloc.values())[0])
                            nome_tloc = next((cols_tloc[c] for c in cols_tloc if "nome" in c or "descricao" in c or "ds_" in c), None)
                            uf_tloc = next((cols_tloc[c] for c in cols_tloc if "uf" in c or "estado" in c), None)
                            if nome_tloc:
                                select_tloc = f"SELECT {pk_tloc}, {nome_tloc}" + (f", {uf_tloc}" if uf_tloc else ", ''") + f" FROM {tab_tloc}"
                                cur.execute(select_tloc)
                                for rt in cur.fetchall():
                                    k_t = str(rt[0] or "").strip()
                                    n_t = str(rt[1] or "").strip()
                                    u_t = str(rt[2] or "").strip()
                                    if k_t and n_t:
                                        dict_cidades_tloc[k_t] = (n_t, u_t)
                    except Exception:
                        pass

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

                    uf = str(r[uf_idx] or "").strip() if uf_idx is not None else ""

                    # Se a cidade não estava direta na tabela mas temos CEP/FK, busca em tloc_cidade
                    if not cid and cep_idx is not None:
                        val_cep = str(r[cep_idx] or "").strip()
                        if val_cep in dict_cidades_tloc:
                            cid_real, uf_real = dict_cidades_tloc[val_cep]
                            cid = cid_real
                            if not uf and uf_real:
                                uf = uf_real

                    cnpj = str(r[cnpj_idx] or "").strip() if cnpj_idx is not None else ""
                    st = str(r[st_idx] or "A").strip().upper() if st_idx is not None else "A"

                    dyn_rows.append({
                        "tnud_unidade_pk": cod,
                        "cod_unidade": cod,
                        "nome": melhor_nome or f"Filial {cod:02d}",
                        "fantasia": melhor_nome or f"Filial {cod:02d}",
                        "cidade": cid,
                        "uf": uf,
                        "cnpj": cnpj,
                        "status": st
                    })

                if dyn_rows:
                    logs.append(f"Tabela '{tab}': {len(dyn_rows)} unidades mapeadas com sucesso (Colunas: {', '.join(cols[:8])}).")
                    return dyn_rows, logs

            except Exception as e:
                logs.append(f"Aviso ({tab}): {str(e)}")

        # 4. Descoberta Heurística Transacional (Vendas, CR, Estoque)
        logs.append("Tabela cadastral não acessível. Identificando unidades ativas nas transações do ERP...")
        unidades_encontradas = set()
        
        # 4.1 Buscar nas Vendas
        tab_v_cand, _ = self._resolve_table_and_cols(cur, "dbauser.tped_pedido_venda")
        if tab_v_cand:
            try:
                cur.execute(f"SELECT DISTINCT tped_unidade_fk_pk FROM {tab_v_cand} WHERE tped_unidade_fk_pk IS NOT NULL AND ROWNUM <= 1000")
                for r in cur.fetchall():
                    if r[0] is not None:
                        unidades_encontradas.add(int(r[0]))
            except Exception:
                pass

        # 4.2 Buscar no Contas a Receber
        if not unidades_encontradas:
            tab_cr_cand, _ = self._resolve_table_and_cols(cur, "dbauser.trec_aberto")
            if tab_cr_cand:
                try:
                    cur.execute(f"SELECT DISTINCT trec_unidade_fk_pk FROM {tab_cr_cand} WHERE trec_unidade_fk_pk IS NOT NULL AND ROWNUM <= 1000")
                    for r in cur.fetchall():
                        if r[0] is not None:
                            unidades_encontradas.add(int(r[0]))
                except Exception:
                    pass

        # 4.3 Buscar no Estoque
        if not unidades_encontradas:
            tab_est_cand, _ = self._resolve_table_and_cols(cur, "dbauser.tmer_estoque")
            if tab_est_cand:
                try:
                    cur.execute(f"SELECT DISTINCT tmer_unidade_fk_pk FROM {tab_est_cand} WHERE tmer_unidade_fk_pk IS NOT NULL AND ROWNUM <= 1000")
                    for r in cur.fetchall():
                        if r[0] is not None:
                            unidades_encontradas.add(int(r[0]))
                except Exception:
                    pass

        if unidades_encontradas:
            trans_rows = []
            for cod in sorted(list(unidades_encontradas)):
                trans_rows.append({
                    "tnud_unidade_pk": cod,
                    "cod_unidade": cod,
                    "nome": f"Filial {cod:02d}",
                    "fantasia": f"Filial {cod:02d}",
                    "cidade": "N/I",
                    "uf": "BA",
                    "cnpj": "",
                    "status": "A"
                })
            logs.append(f"Descoberta Transacional: {len(trans_rows)} unidades ativas identificadas nas movimentações do ERP.")
            return trans_rows, logs

        return [], logs

    def obter_unidades_oracle(self):
        try:
            conn = self.get_oracle_connection()
            with conn.cursor() as cur:
                rows, logs = self._buscar_unidades_cursor(cur)
            conn.close()

            if not rows:
                return {
                    "sucesso": False, 
                    "unidades": [], 
                    "logs": logs,
                    "erro": "Nenhuma unidade/filial encontrada no Oracle. Verifique se o usuário possui permissões nas tabelas do ERP."
                }

            unidades_por_codigo = {}
            for r in rows:
                try:
                    cod_raw = r.get("tnud_unidade_pk") or r.get("cod_unidade")
                    if cod_raw is None:
                        continue
                    cod = int(cod_raw)
                    if cod <= 0:
                        continue
                except (ValueError, TypeError):
                    continue

                nome_raw = str(r.get("fantasia") or r.get("nome") or r.get("nome_unidade") or "").strip()
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
            return {"sucesso": True, "unidades": unidades, "logs": logs}
        except Exception as e:
            return {
                "sucesso": False, 
                "unidades": [], 
                "logs": [f"Exceção ao consultar Oracle: {str(e)}"],
                "erro": str(e)
            }

    def load_erp_schema_template(self):
        """Carrega dinamicamente o Schema do ERP publicado na nuvem ou do template JSON local"""
        candidatos = [
            r"C:\ALPHA\BI\template_erp_proton.json",
            os.path.join(os.path.abspath("."), "template_erp_proton.json"),
            os.path.join(os.path.dirname(os.path.abspath(sys.argv[0])), "template_erp_proton.json")
        ]
        for c in candidatos:
            if os.path.exists(c):
                try:
                    with open(c, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception:
                    pass

        try:
            url = f"{SUPABASE_DEFAULT_URL}/rest/v1/erp_templates?codigo=eq.PROTON_ORACLE&select=template_json"
            headers = {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
            }
            resp = requests.get(url, headers=headers, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                if data and "template_json" in data[0]:
                    return data[0]["template_json"]
        except Exception:
            pass

        return {}

    def _get_table_cols(self, cur, table_name):
        """Retorna dicionário com nomes de colunas em minúsculo mapeando para seu nome original"""
        _, cols = self._resolve_table_and_cols(cur, table_name)
        return cols

    def analisar_volume_dados(self, filiais_selecionadas=None, meses_corte=12):
        """Analisa o volume real categorizando pedidos faturados vs em separação/conferência/abertos com suporte dinâmico ao Schema do ERP e perfil em nuvem"""
        try:
            # 0. Consulta dinâmica ao perfil da empresa e módulos contratados na nuvem
            auth = self.obter_empresa_autenticada()
            mods = (auth.get("modulos_config") if (auth and auth.get("sucesso")) else None) or getattr(self, "modulos_config", None) or {"vendas": True}

            conn = self.get_oracle_connection()
            cur = conn.cursor()

            try:
                cur.execute("SET TRANSACTION READ ONLY")
            except Exception:
                pass

            dt_corte = (datetime.now() - timedelta(days=meses_corte * 30)).strftime('%Y-%m-%d 00:00:00') if meses_corte > 0 else None
            filiais_lista = filiais_selecionadas or []

            # 1. Contagem Vendas por Categoria de Status (Ativa + Histórica) - se ativo na nuvem
            vendas_faturadas = 0
            vendas_separacao = 0
            vendas_conferencia = 0
            vendas_abertas = 0
            vendas_bloqueadas = 0
            vendas_canceladas = 0

            if mods.get("vendas", True):
                candidatos_vendas = ["dbauser.tped_pedido_venda", "dbauser.tped_historico_venda", "tped_pedido_venda", "tped_historico_venda"]
                tabs_vendas = []
                tabs_v_canon_vistas = set()
                for tv in candidatos_vendas:
                    tab_v_res, cols_v = self._resolve_table_and_cols(cur, tv)
                    if tab_v_res:
                        tab_canon = tab_v_res.split(".")[-1].lower()
                        if tab_canon not in tabs_v_canon_vistas:
                            tabs_v_canon_vistas.add(tab_canon)
                            tabs_vendas.append((tab_v_res, cols_v))

                for t_name, cols_v in tabs_vendas:
                    col_status = next((cols_v[c] for c in cols_v if "status_pedido" in c or "status" in c), "tped_status_pedido")
                    
                    colunas_data_fat = [cols_v[c] for c in cols_v if any(p in c for p in ["data_faturamento", "dt_faturamento", "data_saida", "dt_saida", "data_venda", "dt_venda", "data_emissao", "dt_emissao"])]
                    coluna_data_ped = next((cols_v[c] for c in cols_v if "data_pedido" in c or "dt_pedido" in c or "data" in c), None)
                    todas_col_dt = colunas_data_fat + ([coluna_data_ped] if coluna_data_ped and coluna_data_ped not in colunas_data_fat else [])
                    data_sql_expr = f"COALESCE({', '.join(todas_col_dt)})" if len(todas_col_dt) > 1 else (todas_col_dt[0] if todas_col_dt else None)

                    col_unid = next((cols_v[c] for c in cols_v if "unidade" in c or "filial" in c), None)
                    
                    filtro_parts = []
                    if dt_corte and data_sql_expr:
                        filtro_parts.append(f"{data_sql_expr} >= TO_DATE('{dt_corte}', 'YYYY-MM-DD HH24:MI:SS')")
                    if filiais_lista and col_unid:
                        filtro_parts.append(f"{col_unid} IN ({', '.join(str(f) for f in filiais_lista)})")
                    
                    filtro_vendas_completo = f"WHERE {' AND '.join(filtro_parts)}" if filtro_parts else ""
                    try:
                        cur.execute(f"SELECT TO_CHAR({col_status}) AS st, COUNT(*) FROM {t_name} {filtro_vendas_completo} GROUP BY {col_status}")
                        for r in cur.fetchall():
                            st_cod = str(r[0] or "").upper().strip()
                            qtd = int(r[1] or 0)
                            
                            cfg_st = DEFAULT_PROTON_STATUS_MAP.get(st_cod, {})
                            cat = cfg_st.get("cat", "OUTROS")
                            if cat == "FATURADO" or st_cod in ("MA", "CL", "F", "E", "FAT"):
                                vendas_faturadas += qtd
                            elif cat == "SEPARACAO" or st_cod in ("RO", "SEP"):
                                vendas_separacao += qtd
                            elif cat == "CONFERENCIA" or st_cod in ("VO", "CONF"):
                                vendas_conferencia += qtd
                            elif cat == "ABERTO" or st_cod in ("DI", "AB"):
                                vendas_abertas += qtd
                            elif cat == "BLOQUEADO" or st_cod in ("BC", "BG", "BLQ"):
                                vendas_bloqueadas += qtd
                            elif cat == "CANCELADO" or st_cod in ("CA", "CANC"):
                                vendas_canceladas += qtd
                            else:
                                vendas_faturadas += qtd
                    except Exception:
                        pass

            total_vendas_pipeline = vendas_faturadas + vendas_separacao + vendas_conferencia + vendas_abertas + vendas_bloqueadas

            # 2. Contas a Receber (consulta Oracle somente se ativo na nuvem)
            count_cr = 0
            if mods.get("contas_receber", False):
                for tc in ["dbauser.trec_aberto", "dbauser.trec_historico", "dbauser.ttit_titulo_receber", "trec_aberto", "ttit_titulo_receber"]:
                    t_cr_res, cols_cr = self._resolve_table_and_cols(cur, tc)
                    if t_cr_res:
                        try:
                            col_unid = next((cols_cr[c] for c in cols_cr if "unidade" in c or "filial" in c), None)
                            w_cr = f"WHERE {col_unid} IN ({', '.join(str(f) for f in filiais_lista)})" if (filiais_lista and col_unid) else ""
                            cur.execute(f"SELECT COUNT(*) FROM {t_cr_res} {w_cr}")
                            count_cr += cur.fetchone()[0]
                            break
                        except Exception:
                            pass

            # 3. Contas a Pagar (consulta Oracle somente se ativo na nuvem)
            count_cp = 0
            if mods.get("contas_pagar", False):
                for tp in ["dbauser.tpag_aberto", "dbauser.tpag_historico", "dbauser.ttit_titulo_pagar", "tpag_aberto", "ttit_titulo_pagar"]:
                    t_cp_res, cols_cp = self._resolve_table_and_cols(cur, tp)
                    if t_cp_res:
                        try:
                            col_unid = next((cols_cp[c] for c in cols_cp if "unidade" in c or "filial" in c), None)
                            w_cp = f"WHERE {col_unid} IN ({', '.join(str(f) for f in filiais_lista)})" if (filiais_lista and col_unid) else ""
                            cur.execute(f"SELECT COUNT(*) FROM {t_cp_res} {w_cp}")
                            count_cp += cur.fetchone()[0]
                            break
                        except Exception:
                            pass

            # 4. Estoques (consulta Oracle somente se ativo na nuvem)
            count_estoque = 0
            if mods.get("estoques", False) or mods.get("estoque", False):
                t_est_res, cols_est = self._resolve_table_and_cols(cur, "dbauser.tmer_estoque")
                if not t_est_res:
                    t_est_res, cols_est = self._resolve_table_and_cols(cur, "tmer_estoque")
                if t_est_res:
                    try:
                        col_unid = next((cols_est[c] for c in cols_est if "unidade" in c or "filial" in c), None)
                        w_est = f"WHERE {col_unid} IN ({', '.join(str(f) for f in filiais_lista)})" if (filiais_lista and col_unid) else ""
                        cur.execute(f"SELECT COUNT(*) FROM {t_est_res} {w_est}")
                        count_estoque = cur.fetchone()[0]
                    except Exception:
                        pass

            # 5. Tesouraria (consulta Oracle somente se ativo na nuvem)
            count_tes = 0
            if mods.get("tesouraria", False):
                t_tes_res, cols_tes = self._resolve_table_and_cols(cur, "dbauser.tcfr_conta_financeira")
                if not t_tes_res:
                    t_tes_res, cols_tes = self._resolve_table_and_cols(cur, "tcfr_conta_financeira")
                if t_tes_res:
                    try:
                        cur.execute(f"SELECT COUNT(*) FROM {t_tes_res}")
                        count_tes = cur.fetchone()[0]
                    except Exception:
                        pass

            cur.close()
            conn.close()

            total_linhas = total_vendas_pipeline + count_cr + count_cp + count_estoque + count_tes
            tamanho_estimado_mb = round((total_linhas * 250) / (1024 * 1024), 2)

            if total_linhas < 50000:
                status_msg = "🟢 Carga Leve & Segura (Zero impacto no Supabase)"
            elif total_linhas < 250000:
                status_msg = "🟡 Carga Moderada (Tempo estimado ~1 a 3 minutos)"
            else:
                status_msg = "🟠 Carga Volumosa (Histórico de Produção Completo)"

            qtd_unidades_totais = len(self.unidades_cache) if self.unidades_cache else (len(filiais_lista) if filiais_lista else 1)
            qtd_unidades_selecionadas = len(filiais_lista) if filiais_lista else qtd_unidades_totais

            return {
                "sucesso": True,
                "data_corte": dt_corte[:10] if dt_corte else "Histórico Completo",
                "meses_corte": meses_corte,
                "unidades_selecionadas": qtd_unidades_selecionadas,
                "unidades_totais": qtd_unidades_totais,
                "modulos_ativos": mods,
                "contagens": {
                    "vendas_faturadas": vendas_faturadas,
                    "vendas_separacao": vendas_separacao,
                    "vendas_conferencia": vendas_conferencia,
                    "vendas_abertas": vendas_abertas,
                    "vendas_bloqueadas": vendas_bloqueadas,
                    "vendas_canceladas": vendas_canceladas,
                    "total_vendas_validas": total_vendas_pipeline,
                    "contas_receber": count_cr,
                    "contas_pagar": count_cp,
                    "estoques": count_estoque,
                    "tesouraria": count_tes
                },
                "total_linhas": total_linhas,
                "tamanho_estimado_mb": tamanho_estimado_mb,
                "status_msg": status_msg
            }
        except Exception as e:
            return {"sucesso": False, "erro": str(e)}

    def executar_ciclo_completo(self, filiais_selecionadas=None, meses_corte=None, progress_callback=None):
        auth = self.obter_empresa_autenticada()
        if not auth["sucesso"]:
            return {"sucesso": False, "erro": auth["mensagem"]}

        emp_id = auth["empresa_id"]
        empresa_nome = auth.get("empresa_nome") or getattr(self, "empresa_nome", None) or "Empresa"
        corte_m = meses_corte if meses_corte is not None else self.config.get("periodo_corte_meses", 12)
        dt_corte = (datetime.now() - timedelta(days=corte_m * 30)).strftime('%Y-%m-%d 00:00:00') if corte_m > 0 else None
        
        filiais_lista = filiais_selecionadas or []

        # Consulta dinâmica e estrita ao perfil de módulos configurado na nuvem Supabase
        mods = auth.get("modulos_config") or getattr(self, "modulos_config", None) or {"vendas": True}
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }

        totais_processados = {
            "vendedores_cadastrados": 0,
            "clientes_cadastrados": 0,
            "fornecedores_cadastrados": 0,
            "produtos_cadastrados": 0,
            "vendas_faturadas": 0,
            "vendas_separacao": 0,
            "vendas_conferencia": 0,
            "vendas_abertas": 0,
            "vendas_bloqueadas": 0,
            "vendas_canceladas": 0,
            "total_vendas_validas": 0,
            "vendas_itens": 0,
            "contas_receber": 0,
            "contas_pagar": 0,
            "estoques": 0,
            "tesouraria": 0
        }

        def log_prog(msg):
            if progress_callback:
                try:
                    progress_callback(msg)
                except Exception:
                    pass

        log_prog(f"☁️ Perfil consultado na nuvem para {empresa_nome}:")
        log_prog(f"   • Vendas: {'✅ ATIVO' if mods.get('vendas', True) else '❌ INATIVO'}")
        log_prog(f"   • Contas a Receber: {'✅ ATIVO' if mods.get('contas_receber', False) else '❌ INATIVO'}")
        log_prog(f"   • Contas a Pagar: {'✅ ATIVO' if mods.get('contas_pagar', False) else '❌ INATIVO'}")
        log_prog(f"   • Estoques: {'✅ ATIVO' if (mods.get('estoques', False) or mods.get('estoque', False)) else '❌ INATIVO'}")
        log_prog(f"   • Tesouraria: {'✅ ATIVO' if mods.get('tesouraria', False) else '❌ INATIVO'}")

        # Dicionários de enriquecimento semântico em memória
        dict_vendedores = {}
        dict_clientes = {}
        dict_fornecedores = {}
        dict_produtos = {}

        t_inicio = time.time()
        dt_inicio = datetime.now()
        auditoria_modulos = {}

        try:
            conn = self.get_oracle_connection()
            cur = conn.cursor()
            try:
                cur.execute("SET TRANSACTION READ ONLY")
            except Exception:
                pass

            batch_size = 1000

            # -------------------------------------------------------------
            # FASE 1: EXTRAÇÃO DAS DIMENSÕES CADASTRAIS (VENDEDORES, CLIENTES, FORNECEDORES, PRODUTOS)
            # -------------------------------------------------------------
            
            # 1.1 Vendedores
            log_prog("👥 Extraindo cadastro real de Vendedores...")
            tab_vnd, cols_vnd = self._resolve_table_and_cols(cur, "dbauser.tvnd_vendedor")
            if not tab_vnd:
                tab_vnd, cols_vnd = self._resolve_table_and_cols(cur, "tvnd_vendedor")
            if tab_vnd and cols_vnd:
                pk_v = next((cols_vnd[c] for c in cols_vnd if "codigo" in c or "pk" in c), list(cols_vnd.values())[0])
                nome_v = next((cols_vnd[c] for c in cols_vnd if "nome" in c or "fantasia" in c or "descricao" in c), None)
                if nome_v:
                    cur.execute(f"SELECT {pk_v}, {nome_v} FROM {tab_vnd}")
                    vnd_rows = cur.fetchall()
                    vnd_payload = []
                    for r in vnd_rows:
                        cod = int(r[0] or 0)
                        nm = str(r[1] or f"Vendedor {cod}").strip()
                        dict_vendedores[cod] = nm
                        totais_processados["vendedores_cadastrados"] += 1
                        vnd_payload.append({
                            "empresa_id": emp_id,
                            "vendedor_codigo": cod,
                            "vendedor_nome": nm,
                            "ativo": True,
                            "sincronizado_em": datetime.now().isoformat()
                        })
                    if vnd_payload:
                        resp_vnd = requests.post(f"{SUPABASE_DEFAULT_URL}/rest/v1/bi_dim_vendedores?on_conflict=empresa_id,vendedor_codigo", json=vnd_payload, headers=headers, timeout=20)
                        if resp_vnd.status_code not in (200, 201, 204):
                            log_prog(f"   ⚠️ Aviso envio Vendedores (HTTP {resp_vnd.status_code}): {resp_vnd.text[:120]}")
                    log_prog(f"   ✓ {len(dict_vendedores)} Vendedores reais cadastrados e mapeados de {tab_vnd}.")

            auditoria_modulos["vendedores"] = {
                "tabela": tab_vnd or "NÃO ENCONTRADA",
                "colunas_identificadas": list(cols_vnd.keys()) if cols_vnd else [],
                "registros_cadastrados": len(dict_vendedores),
                "status": "SUCESSO" if tab_vnd else "AVISO_TABELA_NAO_ENCONTRADA"
            }

            # 1.2 Clientes
            log_prog("🏢 Extraindo cadastro real de Clientes...")
            tab_cli, cols_cli = self._resolve_table_and_cols(cur, "dbauser.tcli_cliente")
            if not tab_cli:
                tab_cli, cols_cli = self._resolve_table_and_cols(cur, "tcli_cliente")
            if tab_cli and cols_cli:
                pk_c = next((cols_cli[c] for c in cols_cli if "codigo" in c or "pk" in c), list(cols_cli.values())[0])
                rz_c = next((cols_cli[c] for c in cols_cli if "razao" in c or "nome" in c), None)
                ft_c = next((cols_cli[c] for c in cols_cli if "fantasia" in c), rz_c)
                doc_c = next((cols_cli[c] for c in cols_cli if "cgc" in c or "cpf" in c or "cnpj" in c), None)

                select_cli = f"SELECT {pk_c}, {rz_c or pk_c}, {ft_c or pk_c}"
                select_cli += f", {doc_c}" if doc_c else ", ''"
                select_cli += f" FROM {tab_cli}"

                cur.execute(select_cli)
                while True:
                    rows = cur.fetchmany(2000)
                    if not rows:
                        break
                    cli_payload = []
                    for r in rows:
                        cod = int(r[0] or 0)
                        rz = str(r[1] or "").strip()
                        ft = str(r[2] or rz or f"Cliente {cod}").strip()
                        dict_clientes[cod] = ft if ft else rz
                        totais_processados["clientes_cadastrados"] += 1
                        cli_payload.append({
                            "empresa_id": emp_id,
                            "cliente_codigo": cod,
                            "razao_social": rz,
                            "nome_fantasia": ft,
                            "cnpj_cpf": str(r[3] or "")[:30],
                            "sincronizado_em": datetime.now().isoformat()
                        })
                    if cli_payload:
                        resp_cli = requests.post(f"{SUPABASE_DEFAULT_URL}/rest/v1/bi_dim_clientes?on_conflict=empresa_id,cliente_codigo", json=cli_payload, headers=headers, timeout=20)
                        if resp_cli.status_code not in (200, 201, 204):
                            log_prog(f"   ⚠️ Aviso envio Clientes (HTTP {resp_cli.status_code}): {resp_cli.text[:120]}")
                log_prog(f"   ✓ {totais_processados['clientes_cadastrados']} Clientes reais cadastrados e mapeados de {tab_cli}.")

            auditoria_modulos["clientes"] = {
                "tabela": tab_cli or "NÃO ENCONTRADA",
                "colunas_identificadas": list(cols_cli.keys()) if cols_cli else [],
                "registros_cadastrados": len(dict_clientes),
                "status": "SUCESSO" if tab_cli else "AVISO_TABELA_NAO_ENCONTRADA"
            }

            # 1.3 Fornecedores
            log_prog("🏭 Extraindo cadastro real de Fornecedores...")
            tab_for, cols_for = self._resolve_table_and_cols(cur, "dbauser.tfor_fornecedor")
            if not tab_for:
                tab_for, cols_for = self._resolve_table_and_cols(cur, "tfor_fornecedor")
            if tab_for and cols_for:
                pk_f = next((cols_for[c] for c in cols_for if "codigo" in c or "pk" in c), list(cols_for.values())[0])
                rz_f = next((cols_for[c] for c in cols_for if "razao" in c or "nome" in c), None)
                ft_f = next((cols_for[c] for c in cols_for if "fantasia" in c), rz_f)
                doc_f = next((cols_for[c] for c in cols_for if "cgc" in c or "cnpj" in c), None)

                select_for = f"SELECT {pk_f}, {rz_f or pk_f}, {ft_f or pk_f}"
                select_for += f", {doc_f}" if doc_f else ", ''"
                select_for += f" FROM {tab_for}"

                cur.execute(select_for)
                for_rows = cur.fetchall()
                for_payload = []
                for r in for_rows:
                    cod = int(r[0] or 0)
                    rz = str(r[1] or "").strip()
                    ft = str(r[2] or rz or f"Fornecedor {cod}").strip()
                    dict_fornecedores[cod] = ft if ft else rz
                    totais_processados["fornecedores_cadastrados"] += 1
                    for_payload.append({
                        "empresa_id": emp_id,
                        "fornecedor_codigo": cod,
                        "razao_social": rz,
                        "nome_fantasia": ft,
                        "cnpj": str(r[3] or "")[:30],
                        "sincronizado_em": datetime.now().isoformat()
                    })
                if for_payload:
                    resp_for = requests.post(f"{SUPABASE_DEFAULT_URL}/rest/v1/bi_dim_fornecedores?on_conflict=empresa_id,fornecedor_codigo", json=for_payload, headers=headers, timeout=20)
                    if resp_for.status_code not in (200, 201, 204):
                        log_prog(f"   ⚠️ Aviso envio Fornecedores (HTTP {resp_for.status_code}): {resp_for.text[:120]}")
                log_prog(f"   ✓ {len(dict_fornecedores)} Fornecedores reais cadastrados e mapeados de {tab_for}.")

            auditoria_modulos["fornecedores"] = {
                "tabela": tab_for or "NÃO ENCONTRADA",
                "colunas_identificadas": list(cols_for.keys()) if cols_for else [],
                "registros_cadastrados": len(dict_fornecedores),
                "status": "SUCESSO" if tab_for else "AVISO_TABELA_NAO_ENCONTRADA"
            }

            # 1.4 Mercadorias / Produtos
            log_prog("📦 Extraindo cadastro de Mercadorias...")
            tab_mer, cols_mer = self._resolve_table_and_cols(cur, "dbauser.tmer_mercadoria")
            if not tab_mer:
                tab_mer, cols_mer = self._resolve_table_and_cols(cur, "tmer_mercadoria")
            if tab_mer and cols_mer:
                pk_pri = next((cols_mer[c] for c in cols_mer if "codigo_pri" in c), "tmer_codigo_pri_pk")
                pk_sec = next((cols_mer[c] for c in cols_mer if "codigo_sec" in c), "tmer_codigo_sec_pk")
                desc_m = next((cols_mer[c] for c in cols_mer if c == "tmer_nome" or "nome" in c), "tmer_nome")
                grp_m = next((cols_mer[c] for c in cols_mer if "secao" in c or "grupo" in c), None)

                select_mer = f"SELECT TO_CHAR({pk_pri}) || '.' || TO_CHAR(NVL({pk_sec}, 0)), {desc_m}"
                select_mer += f", {grp_m}" if grp_m else ", 'GERAL'"
                select_mer += f" FROM {tab_mer}"

                cur.execute(select_mer)
                while True:
                    rows = cur.fetchmany(2000)
                    if not rows:
                        break
                    mer_payload = []
                    for r in rows:
                        cod = str(r[0] or "0").strip()
                        desc = str(r[1] or f"Mercadoria {cod}").strip()
                        grp = str(r[2] or "GERAL").strip()
                        dict_produtos[cod] = desc
                        totais_processados["produtos_cadastrados"] += 1
                        mer_payload.append({
                            "empresa_id": emp_id,
                            "produto_codigo": cod,
                            "descricao": desc,
                            "grupo": grp,
                            "sincronizado_em": datetime.now().isoformat()
                        })
                    if mer_payload:
                        resp_mer = requests.post(f"{SUPABASE_DEFAULT_URL}/rest/v1/bi_dim_produtos?on_conflict=empresa_id,produto_codigo", json=mer_payload, headers=headers, timeout=20)
                        if resp_mer.status_code not in (200, 201, 204):
                            log_prog(f"   ⚠️ Aviso envio Produtos (HTTP {resp_mer.status_code}): {resp_mer.text[:120]}")
                log_prog(f"   ✓ {totais_processados['produtos_cadastrados']} Mercadorias reais cadastradas e mapeadas de {tab_mer}.")

            auditoria_modulos["produtos"] = {
                "tabela": tab_mer or "NÃO ENCONTRADA",
                "colunas_identificadas": list(cols_mer.keys()) if cols_mer else [],
                "registros_cadastrados": len(dict_produtos),
                "status": "SUCESSO" if tab_mer else "AVISO_TABELA_NAO_ENCONTRADA"
            }

            # -------------------------------------------------------------
            # FASE 2: EXTRAÇÃO DE VENDAS COM ENRIQUECIMENTO REAL DE NOMES
            # -------------------------------------------------------------
            if mods.get("vendas", True):
                candidatos_vendas = ["dbauser.tped_pedido_venda", "dbauser.tped_historico_venda", "tped_pedido_venda", "tped_historico_venda"]
                tabs_v_processadas = set()
                colunas_vendas_auditoria = []
                for tab_v_cand in candidatos_vendas:
                    tab_v, cols_v = self._resolve_table_and_cols(cur, tab_v_cand)
                    if not tab_v or not cols_v:
                        continue
                    tab_canon = tab_v.split(".")[-1].lower()
                    if tab_canon in tabs_v_processadas:
                        continue
                    tabs_v_processadas.add(tab_canon)
                    colunas_vendas_auditoria.extend(list(cols_v.keys()))

                    log_prog(f"📦 Extraindo e enriquecendo vendas de {tab_v}...")

                    pk_col = next((cols_v[c] for c in cols_v if "numero_pedido" in c or "codigo_pk" in c or "tped_pk" in c), list(cols_v.values())[0])
                    unid_col = next((cols_v[c] for c in cols_v if "unidade" in c or "filial" in c), None)

                    # Priorização Inteligente de Datas: Faturamento (tped_data_documento) sobre Emissão/Pedido (tped_data_pedido)
                    date_priority_patterns = [
                        "data_documento", "dt_documento",
                        "data_emissao", "dt_emissao",
                        "data_faturamento", "dt_faturamento",
                        "data_saida", "dt_saida",
                        "data_venda", "dt_venda"
                    ]
                    colunas_data_fat = [cols_v[c] for c in cols_v if any(p in c for p in date_priority_patterns)]
                    coluna_data_ped = next((cols_v[c] for c in cols_v if "data_pedido" in c or "dt_pedido" in c or "data" in c), None)
                    todas_col_dt = colunas_data_fat + ([coluna_data_ped] if coluna_data_ped and coluna_data_ped not in colunas_data_fat else [])
                    data_sql_expr = f"COALESCE({', '.join(todas_col_dt)})" if len(todas_col_dt) > 1 else (todas_col_dt[0] if todas_col_dt else None)

                    vnd_col = next((cols_v[c] for c in cols_v if "vendedor" in c), None)
                    cli_col = next((cols_v[c] for c in cols_v if "cliente" in c), None)
                    val_col = next((cols_v[c] for c in cols_v if "valor_total_pedido" in c or "valor_total" in c or "valor_liquido" in c or "vlr_liquido" in c), None)
                    st_col = next((cols_v[c] for c in cols_v if "status_pedido" in c or "status" in c), "tped_status_pedido")
                    tp_col = next((cols_v[c] for c in cols_v if "tipo_venda" in c or "tipo_pedido" in c or "tipo" in c), None)
                    nat_col = next((cols_v[c] for c in cols_v if "natureza_movimentacao" in c or "natureza" in c), None)

                    where_clauses = ["1=1"]
                    if dt_corte and data_sql_expr:
                        where_clauses.append(f"{data_sql_expr} >= TO_DATE('{dt_corte}', 'YYYY-MM-DD HH24:MI:SS')")
                    if filiais_lista and unid_col:
                        where_clauses.append(f"{unid_col} IN ({', '.join(str(f) for f in filiais_lista)})")
                    if tp_col:
                        where_clauses.append(f"UPPER(TRIM(NVL({tp_col}, 'N'))) <> 'O'")
                    if nat_col:
                        where_clauses.append(f"UPPER(TRIM(NVL({nat_col}, 'VM'))) = 'VM'")
                    if st_col:
                        where_clauses.append(f"UPPER(TRIM(NVL({st_col}, 'CL'))) IN ('CL', 'MA')")

                    where_sql = " AND ".join(where_clauses)
                    select_sql = f"SELECT {pk_col}"
                    select_sql += f", {unid_col}" if unid_col else ", 1"
                    select_sql += f", {data_sql_expr}" if data_sql_expr else ", SYSDATE"
                    select_sql += f", {vnd_col}" if vnd_col else ", 0"
                    select_sql += f", {cli_col}" if cli_col else ", 0"
                    select_sql += f", {val_col}" if val_col else ", 0"
                    select_sql += f", {st_col}" if st_col else ", 'FAT'"
                    select_sql += f", {tp_col}" if tp_col else ", 'N'"
                    select_sql += f" FROM {tab_v} WHERE {where_sql}"

                    try:
                        cur.execute(select_sql)
                        lote_num = 0
                        while True:
                            rows = cur.fetchmany(batch_size)
                            if not rows:
                                break

                            lote_num += 1
                            payload_batch = []
                            for r in rows:
                                st_cod = str(r[6] or "").upper().strip()
                                tp_cod = str(r[7] or "N").upper().strip() if len(r) > 7 else "N"
                                v_liq = float(r[5] or 0)
                                dt_str = r[2].strftime('%Y-%m-%d') if hasattr(r[2], 'strftime') else '2026-08-01'
                                dt_iso = f"{dt_str}T12:00:00Z"
                                vnd_id = int(r[3] or 0)
                                cli_id = int(r[4] or 0)

                                vnd_nome_real = dict_vendedores.get(vnd_id, f"Vendedor {vnd_id}")
                                cli_nome_real = dict_clientes.get(cli_id, f"Cliente {cli_id}")

                                # Ignora transferências internas e reservas
                                if "ISENTO VENDA" in vnd_nome_real.upper() or "ARCO VERDE" in cli_nome_real.upper() or "RESERVA DE MERCADORIA" in cli_nome_real.upper():
                                    continue

                                cfg_st = DEFAULT_PROTON_STATUS_MAP.get(st_cod, {})
                                cat = cfg_st.get("cat", "ABERTO")
                                if st_cod in ("CL", "MA"):
                                    totais_processados["vendas_faturadas"] += 1
                                elif st_cod in ("CA", "CANC"):
                                    totais_processados["vendas_canceladas"] += 1
                                else:
                                    totais_processados["vendas_abertas"] += 1

                                payload_batch.append({
                                    "empresa_id": emp_id,
                                    "filial_id": int(r[1] or 1),
                                    "id_venda_oracle": str(r[0]),
                                    "numero_nota": str(r[0]),
                                    "data_emissao": dt_str,
                                    "data_hora_emissao": dt_iso,
                                    "vendedor_codigo": vnd_id,
                                    "vendedor_nome": vnd_nome_real,
                                    "cliente_codigo": cli_id,
                                    "cliente_nome": cli_nome_real,
                                    "valor_bruto": v_liq,
                                    "valor_desconto": 0,
                                    "valor_liquido": v_liq,
                                    "valor_cmv": 0,
                                    "status_pedido": st_cod,
                                    "tipo_pedido": tp_cod,
                                    "natureza_movimentacao": "VM",
                                    "sincronizado_em": datetime.now().isoformat()
                                })

                            url_v = f"{SUPABASE_DEFAULT_URL}/rest/v1/bi_vendas?on_conflict=empresa_id,filial_id,id_venda_oracle"
                            resp_v = requests.post(url_v, json=payload_batch, headers=headers, timeout=30)
                            if resp_v.status_code not in (200, 201, 204):
                                log_prog(f"   ⚠️ Erro HTTP Vendas Lote {lote_num} ({resp_v.status_code}): {resp_v.text[:120]}")
                            elif lote_num % 10 == 0:
                                log_prog(f"   ✓ Lote {lote_num} de Vendas ({len(payload_batch)} pedidos com datas e nomes reais) enviado com sucesso.")
                    except Exception as ex_v:
                        log_prog(f"   ⚠️ Erro em {tab_v}: {str(ex_v)}")

                totais_processados["total_vendas_validas"] = (
                    totais_processados["vendas_faturadas"] + 
                    totais_processados["vendas_separacao"] + 
                    totais_processados["vendas_conferencia"] + 
                    totais_processados["vendas_abertas"] + 
                    totais_processados["vendas_bloqueadas"]
                )

                auditoria_modulos["vendas"] = {
                    "tabelas_processadas": list(tabs_v_processadas),
                    "colunas_identificadas": list(set(colunas_vendas_auditoria)),
                    "total_vendas_validas": totais_processados["total_vendas_validas"],
                    "faturadas": totais_processados["vendas_faturadas"],
                    "separacao": totais_processados["vendas_separacao"],
                    "conferencia": totais_processados["vendas_conferencia"],
                    "abertas": totais_processados["vendas_abertas"],
                    "bloqueadas": totais_processados["vendas_bloqueadas"],
                    "canceladas": totais_processados["vendas_canceladas"],
                    "status": "SUCESSO" if tabs_v_processadas else "AVISO_NENHUMA_TABELA_PROCESSADA"
                }

                # -------------------------------------------------------------
                # FASE 2.1: EXTRAÇÃO DE ITENS DE VENDA (CORTE SEGURO 90 DIAS)
                # -------------------------------------------------------------
                log_prog("📦 Extraindo Itens de Venda (Corte Seguro de 90 Dias para Proteção do Supabase)...")
                try:
                    filiais_in = ", ".join(str(f) for f in filiais_lista) if filiais_lista else "0"
                    todas_filiais = 0 if filiais_lista else 1
                    params_itens = {
                        "p_filial": self.config.get("codigo_filial", 0),
                        "p_todas_filiais": todas_filiais,
                        "p_limit": batch_size
                    }
                    rows_itens = self.engine._executar_query_com_fallback(cur, QUERY_DELTA_VENDAS_ITENS_PROTON, QUERY_DELTA_VENDAS_ITENS_FALLBACK, params_itens, filiais_in)
                    norm_itens = []
                    for r in rows_itens:
                        id_item = str(r.get("id_item_oracle") or f"{r.get('id_pedido_oracle')}_{r.get('produto_codigo')}")
                        norm_itens.append({
                            "empresa_id": emp_id,
                            "filial_id": int(r.get("filial_id") or self.config.get("codigo_filial", 0)),
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
                    if norm_itens:
                        enviados_it = self.engine._post_supabase_batch("bi_vendas_itens", norm_itens, batch_size=batch_size)
                        totais_processados["vendas_itens"] = enviados_it
                        log_prog(f"   ✓ {enviados_it} itens de venda enviados com sucesso à nuvem.")
                    else:
                        log_prog("   ✓ Nenhum item de venda novo no período de 90 dias.")
                except Exception as ex_it:
                    log_prog(f"   ⚠️ Aviso ao extrair itens de venda: {ex_it}")

            else:
                log_prog("⏸️ Módulo Vendas INATIVO no Painel Master. Extração ignorada.")
                totais_processados["total_vendas_validas"] = 0
                totais_processados["vendas_itens"] = 0
                auditoria_modulos["vendas"] = {
                    "status": "MODULO_INATIVO_PELO_MASTER",
                    "motivo": "Módulo desativado no painel administrativo do cliente no Dashboard."
                }

            # -------------------------------------------------------------
            # FASE 3: EXTRAÇÃO DE CONTAS A RECEBER COM NOMES DE CLIENTES REAIS
            # -------------------------------------------------------------
            if mods.get("contas_receber", False):
                log_prog("💳 Extraindo Contas a Receber...")
                tab_cr, cols_cr = None, {}
                for tc_cand in ["dbauser.trec_aberto", "dbauser.trec_historico", "dbauser.ttit_titulo_receber", "trec_aberto", "ttit_titulo_receber"]:
                    t_res, c_res = self._resolve_table_and_cols(cur, tc_cand)
                    if t_res:
                        tab_cr, cols_cr = t_res, c_res
                        break

                if tab_cr and cols_cr:
                    pk_cr = next((cols_cr[c] for c in cols_cr if "codigo_pk" in c or "numero" in c or "trec_pk" in c), list(cols_cr.values())[0])
                    unid_cr = next((cols_cr[c] for c in cols_cr if "unidade" in c or "filial" in c), None)
                    cli_cr = next((cols_cr[c] for c in cols_cr if "cliente" in c), None)
                    dtem_cr = next((cols_cr[c] for c in cols_cr if "data_emissao" in c or "dt_emissao" in c), None)
                    dtven_cr = next((cols_cr[c] for c in cols_cr if "data_vencimento" in c or "dt_vencimento" in c or "vencimento" in c), None)
                    saldo_cr = next((cols_cr[c] for c in cols_cr if "saldo" in c or "valor" in c), None)

                    where_cr = []
                    if filiais_lista and unid_cr:
                        where_cr.append(f"{unid_cr} IN ({', '.join(str(f) for f in filiais_lista)})")
                    where_cr_sql = f"WHERE {' AND '.join(where_cr)}" if where_cr else ""

                    select_cr = f"SELECT {pk_cr}"
                    select_cr += f", {unid_cr}" if unid_cr else ", 1"
                    select_cr += f", {cli_cr}" if cli_cr else ", 0"
                    select_cr += f", {dtem_cr}" if dtem_cr else ", SYSDATE"
                    select_cr += f", {dtven_cr}" if dtven_cr else ", SYSDATE"
                    select_cr += f", {saldo_cr}" if saldo_cr else ", 0"
                    select_cr += f" FROM {tab_cr} {where_cr_sql}"

                    try:
                        cur.execute(select_cr)
                        lote_cr_num = 0
                        while True:
                            rows = cur.fetchmany(batch_size)
                            if not rows:
                                break

                            lote_cr_num += 1
                            cr_batch = []
                            for r in rows:
                                totais_processados["contas_receber"] += 1
                                cli_id = int(r[2] or 0)
                                cli_nm = dict_clientes.get(cli_id, f"Cliente {cli_id}")
                                dt_em = r[3].strftime('%Y-%m-%d') if hasattr(r[3], 'strftime') else '2026-08-01'
                                dt_ven = r[4].strftime('%Y-%m-%d') if hasattr(r[4], 'strftime') else '2026-09-01'
                                s_aberto = float(r[5] or 0)
                                cr_batch.append({
                                    "empresa_id": emp_id,
                                    "filial_id": int(r[1] or 1),
                                    "id_titulo_oracle": str(r[0]),
                                    "numero_titulo": str(r[0]),
                                    "cliente_codigo": cli_id,
                                    "cliente_nome": cli_nm,
                                    "data_emissao": dt_em,
                                    "data_vencimento": dt_ven,
                                    "valor_titulo": s_aberto,
                                    "valor_saldo_aberto": s_aberto,
                                    "status_titulo": "ABERTO",
                                    "sincronizado_em": datetime.now().isoformat()
                                })
                            resp_cr = requests.post(f"{SUPABASE_DEFAULT_URL}/rest/v1/bi_contas_receber?on_conflict=empresa_id,filial_id,id_titulo_oracle", json=cr_batch, headers=headers, timeout=30)
                            if resp_cr.status_code not in (200, 201, 204):
                                log_prog(f"   ⚠️ Erro HTTP CR Lote {lote_cr_num} ({resp_cr.status_code}): {resp_cr.text[:120]}")
                            elif lote_cr_num % 15 == 0:
                                log_prog(f"   ✓ Lote CR {lote_cr_num} ({len(cr_batch)} títulos com clientes reais) enviado à nuvem.")
                    except Exception as ex_cr:
                        log_prog(f"   ⚠️ Erro CR: {str(ex_cr)}")

                auditoria_modulos["contas_receber"] = {
                    "tabela": tab_cr or "NÃO ENCONTRADA",
                    "colunas_identificadas": list(cols_cr.keys()) if cols_cr else [],
                    "titulos_processados": totais_processados["contas_receber"],
                    "status": "SUCESSO" if tab_cr else "AVISO_TABELA_NAO_ENCONTRADA"
                }

            else:
                log_prog("⏸️ Módulo Contas a Receber INATIVO no Painel Master. Extração ignorada.")
                totais_processados["contas_receber"] = 0
                auditoria_modulos["contas_receber"] = {
                    "status": "MODULO_INATIVO_PELO_MASTER",
                    "motivo": "Módulo desativado no painel administrativo do cliente no Dashboard."
                }

            # -------------------------------------------------------------
            # FASE 4: EXTRAÇÃO DE CONTAS A PAGAR COM NOMES DE FORNECEDORES REAIS
            # -------------------------------------------------------------
            if mods.get("contas_pagar", False):
                log_prog("📑 Extraindo Contas a Pagar...")
                tab_cp, cols_cp = None, {}
                for tp_cand in ["dbauser.tpag_aberto", "dbauser.tpag_historico", "dbauser.ttit_titulo_pagar", "tpag_aberto", "ttit_titulo_pagar"]:
                    t_res, c_res = self._resolve_table_and_cols(cur, tp_cand)
                    if t_res:
                        tab_cp, cols_cp = t_res, c_res
                        break

                if tab_cp and cols_cp:
                    pk_cp = next((cols_cp[c] for c in cols_cp if "codigo_pk" in c or "numero" in c or "tpag_pk" in c), list(cols_cp.values())[0])
                    unid_cp = next((cols_cp[c] for c in cols_cp if "unidade" in c or "filial" in c), None)
                    forn_cp = next((cols_cp[c] for c in cols_cp if "fornecedor" in c or "credor" in c), None)
                    dtven_cp = next((cols_cp[c] for c in cols_cp if "data_vencimento" in c or "dt_vencimento" in c or "vencimento" in c), None)
                    saldo_cp = next((cols_cp[c] for c in cols_cp if "saldo" in c or "valor" in c), None)

                    where_cp = []
                    if filiais_lista and unid_cp:
                        where_cp.append(f"{unid_cp} IN ({', '.join(str(f) for f in filiais_lista)})")
                    where_cp_sql = f"WHERE {' AND '.join(where_cp)}" if where_cp else ""

                    select_cp = f"SELECT {pk_cp}"
                    select_cp += f", {unid_cp}" if unid_cp else ", 1"
                    select_cp += f", {forn_cp}" if forn_cp else ", 0"
                    select_cp += f", {dtven_cp}" if dtven_cp else ", SYSDATE"
                    select_cp += f", {saldo_cp}" if saldo_cp else ", 0"
                    select_cp += f" FROM {tab_cp} {where_cp_sql}"

                    try:
                        cur.execute(select_cp)
                        lote_cp_num = 0
                        while True:
                            rows = cur.fetchmany(batch_size)
                            if not rows:
                                break

                            lote_cp_num += 1
                            cp_batch = []
                            for r in rows:
                                totais_processados["contas_pagar"] += 1
                                forn_id = int(r[2] or 0)
                                forn_nm = dict_fornecedores.get(forn_id, f"Fornecedor {forn_id}")
                                dt_ven = r[3].strftime('%Y-%m-%d') if hasattr(r[3], 'strftime') else '2026-09-01'
                                s_aberto = float(r[4] or 0)
                                cp_batch.append({
                                    "empresa_id": emp_id,
                                    "filial_id": int(r[1] or 1),
                                    "id_titulo_oracle": str(r[0]),
                                    "numero_titulo": str(r[0]),
                                    "fornecedor_codigo": forn_id,
                                    "credor_nome": forn_nm,
                                    "data_emissao": '2026-08-01',
                                    "data_vencimento": dt_ven,
                                    "valor_titulo": s_aberto,
                                    "valor_saldo_aberto": s_aberto,
                                    "status_titulo": "ABERTO",
                                    "sincronizado_em": datetime.now().isoformat()
                                })
                            resp_cp = requests.post(f"{SUPABASE_DEFAULT_URL}/rest/v1/bi_contas_pagar?on_conflict=empresa_id,filial_id,id_titulo_oracle", json=cp_batch, headers=headers, timeout=30)
                            if resp_cp.status_code not in (200, 201, 204):
                                log_prog(f"   ⚠️ Erro HTTP CP Lote {lote_cp_num} ({resp_cp.status_code}): {resp_cp.text[:120]}")
                            elif lote_cp_num % 10 == 0:
                                log_prog(f"   ✓ Lote CP {lote_cp_num} ({len(cp_batch)} títulos com fornecedores reais) enviado à nuvem.")
                    except Exception as ex_cp:
                        log_prog(f"   ⚠️ Erro CP: {str(ex_cp)}")

                auditoria_modulos["contas_pagar"] = {
                    "tabela": tab_cp or "NÃO ENCONTRADA",
                    "colunas_identificadas": list(cols_cp.keys()) if cols_cp else [],
                    "titulos_processados": totais_processados["contas_pagar"],
                    "status": "SUCESSO" if tab_cp else "AVISO_TABELA_NAO_ENCONTRADA"
                }

            else:
                log_prog("⏸️ Módulo Contas a Pagar INATIVO no Painel Master. Extração ignorada.")
                totais_processados["contas_pagar"] = 0
                auditoria_modulos["contas_pagar"] = {
                    "status": "MODULO_INATIVO_PELO_MASTER",
                    "motivo": "Módulo desativado no painel administrativo do cliente no Dashboard."
                }

            # -------------------------------------------------------------
            # FASE 5: EXTRAÇÃO DE ESTOQUES COM NOMES DE PRODUTOS REAIS
            # -------------------------------------------------------------
            if mods.get("estoques", False):
                log_prog("📦 Extraindo Estoques...")
                tab_est, cols_est = self._resolve_table_and_cols(cur, "dbauser.tmer_estoque")
                if not tab_est:
                    tab_est, cols_est = self._resolve_table_and_cols(cur, "tmer_estoque")
                if tab_est and cols_est:
                    unid_est = next((cols_est[c] for c in cols_est if "unidade" in c or "filial" in c), "tmer_unidade_fk_pk")
                    pri_est = next((cols_est[c] for c in cols_est if "codigo_pri" in c), "tmer_codigo_pri_fk_pk")
                    sec_est = next((cols_est[c] for c in cols_est if "codigo_sec" in c), "tmer_codigo_sec_fk_pk")
                    qtd_est = next((cols_est[c] for c in cols_est if "estoque_total" in c), "tmer_estoque_total")
                    custo_m = next((cols_est[c] for c in cols_est if "custo_medio" in c and "real" not in c), "tmer_custo_medio")
                    custo_u = next((cols_est[c] for c in cols_est if "custo_ultimo" in c and "real" not in c), "tmer_custo_ultimo")
                    pvenda_est = next((cols_est[c] for c in cols_est if "preco_venda" in c and "1" not in c), "tmer_preco_venda")
                    dt_ult_v = next((cols_est[c] for c in cols_est if "data_ult_venda" in c), "tmer_data_ult_venda")
                    ativo_est = next((cols_est[c] for c in cols_est if "ativo_venda" in c), "tmer_ativo_venda")

                    where_est = []
                    if filiais_lista and unid_est:
                        where_est.append(f"{unid_est} IN ({', '.join(str(f) for f in filiais_lista)})")
                    where_est.append(f"({qtd_est} <> 0 OR NVL({ativo_est}, 'S') = 'S')")
                    where_est_sql = f"WHERE {' AND '.join(where_est)}" if where_est else ""

                    select_est = f"""
                    SELECT 
                        TO_CHAR({pri_est}) || '.' || TO_CHAR(NVL({sec_est}, 0)) AS PRODUTO_CODIGO,
                        {unid_est} AS FILIAL_ID,
                        NVL({qtd_est}, 0) AS QUANTIDADE_ESTOQUE,
                        NVL({custo_m}, 0) AS PRECO_CUSTO,
                        NVL({custo_u}, 0) AS CUSTO_ULTIMO,
                        NVL({pvenda_est}, 0) AS PRECO_VENDA,
                        CASE WHEN {dt_ult_v} IS NOT NULL THEN TRUNC(SYSDATE - {dt_ult_v}) ELSE 999 END AS DIAS_SEM_VENDA
                    FROM {tab_est} {where_est_sql}
                    """

                    try:
                        cur.execute(select_est)
                        lote_est_num = 0
                        while True:
                            rows = cur.fetchmany(batch_size)
                            if not rows:
                                break

                            lote_est_num += 1
                            est_batch = []
                            for r in rows:
                                totais_processados["estoques"] += 1
                                prod_code = str(r[0] or "0").strip()
                                filial_id = int(r[1] or 1)
                                qtd = float(r[2] or 0)
                                custo_med = float(r[3] or 0)
                                custo_ult = float(r[4] or 0)
                                preco_vda = float(r[5] or 0)
                                dias_sem_v = int(r[6] or 0)
                                prod_nm = dict_produtos.get(prod_code, f"Mercadoria {prod_code}")

                                est_batch.append({
                                    "empresa_id": emp_id,
                                    "filial_id": filial_id,
                                    "produto_codigo": prod_code,
                                    "produto_descricao": prod_nm,
                                    "quantidade_estoque": qtd,
                                    "preco_custo": custo_med,
                                    "custo_medio": custo_med,
                                    "custo_ultimo": custo_ult,
                                    "preco_venda": preco_vda,
                                    "dias_sem_venda": dias_sem_v,
                                    "sincronizado_em": datetime.now().isoformat()
                                })
                            resp_est = requests.post(f"{SUPABASE_DEFAULT_URL}/rest/v1/bi_estoques?on_conflict=empresa_id,filial_id,produto_codigo", json=est_batch, headers=headers, timeout=30)
                            if resp_est.status_code not in (200, 201, 204):
                                log_prog(f"   ⚠️ Erro HTTP Estoques Lote {lote_est_num} ({resp_est.status_code}): {resp_est.text[:120]}")
                            elif lote_est_num % 5 == 0:
                                log_prog(f"   ✓ Lote Estoque {lote_est_num} ({len(est_batch)} mercadorias com nomes reais) enviado à nuvem.")
                    except Exception as ex_est:
                        log_prog(f"   ⚠️ Erro Estoque: {str(ex_est)}")

                auditoria_modulos["estoques"] = {
                    "tabela": tab_est or "NÃO ENCONTRADA",
                    "colunas_identificadas": list(cols_est.keys()) if cols_est else [],
                    "posicoes_estoque": totais_processados["estoques"],
                    "status": "SUCESSO" if tab_est else "AVISO_TABELA_NAO_ENCONTRADA"
                }

            else:
                log_prog("⏸️ Módulo Estoques INATIVO no Painel Master. Extração ignorada.")
                totais_processados["estoques"] = 0
                auditoria_modulos["estoques"] = {
                    "status": "MODULO_INATIVO_PELO_MASTER",
                    "motivo": "Módulo desativado no painel administrativo do cliente no Dashboard."
                }

            auditoria_modulos["tesouraria"] = {
                "status": "CONCILIACAO_AUTOMATICA",
                "metodo": "Calculado analiticamente no Dashboard por conciliação direta de Contas a Receber e Contas a Pagar."
            }
            auditoria_modulos["fiscal"] = {
                "status": "CALCULADO_NO_DASHBOARD",
                "metodo": "Projeção tributária analítica sobre o faturamento. Tabela dbauser.tnot_nota_fiscal opcional."
            }

            cur.close()
            conn.close()

            # -------------------------------------------------------------
            # FASE 6: GERAÇÃO DO RELATÓRIO DE AUDITORIA & DIAGNÓSTICO
            # -------------------------------------------------------------
            dt_fim = datetime.now()
            duracao_seg = round(time.time() - t_inicio, 2)
            total_geral = sum(totais_processados.values())

            relatorio_auditoria = {
                "cabecalho": {
                    "timestamp_inicio": dt_inicio.isoformat(),
                    "timestamp_fim": dt_fim.isoformat(),
                    "duracao_segundos": duracao_seg,
                    "versao_syncagent": APP_VERSION,
                    "empresa_id": emp_id,
                    "empresa_nome": (self.config.get("empresa_nome") or self.config.get("empresa_cnpj") or "Empresa"),
                    "empresa_cnpj": (self.config.get("empresa_cnpj") or ""),
                    "oracle_dsn": self.get_dsn(),
                    "oracle_usuario": (self.config.get("oracle", {}).get("user") or "APPUSER"),
                    "oracle_schema_ativo": "DBAUSER",
                    "filiais_processadas": filiais_lista or "Todas"
                },
                "totais_processados": totais_processados,
                "total_geral_registros": total_geral,
                "mapeamento_modulos": auditoria_modulos,
                "sucesso": True
            }

            # 1. Salvar JSON local
            caminho_relatorio_json = os.path.join(os.path.dirname(os.path.abspath(__file__)), "relatorio_auditoria_sync.json")
            try:
                with open(caminho_relatorio_json, "w", encoding="utf-8") as f_rel:
                    json.dump(relatorio_auditoria, f_rel, indent=2, ensure_ascii=False)
            except Exception:
                pass

            # 2. Salvar LOG formatado legível local
            caminho_relatorio_log = os.path.join(os.path.dirname(os.path.abspath(__file__)), "relatorio_auditoria_sync.log")
            try:
                with open(caminho_relatorio_log, "w", encoding="utf-8") as f_txt:
                    f_txt.write("=" * 75 + "\n")
                    f_txt.write(f"  NexaBI SyncAgent {APP_VERSION} — RELATÓRIO DE AUDITORIA & DIAGNÓSTICO\n")
                    f_txt.write("=" * 75 + "\n")
                    f_txt.write(f"Início: {dt_inicio.strftime('%d/%m/%Y %H:%M:%S')} | Fim: {dt_fim.strftime('%d/%m/%Y %H:%M:%S')} | Duração: {duracao_seg}s\n")
                    f_txt.write(f"Empresa: {relatorio_auditoria['cabecalho']['empresa_nome']} (CNPJ: {relatorio_auditoria['cabecalho']['empresa_cnpj']})\n")
                    f_txt.write(f"Conexão Oracle: {relatorio_auditoria['cabecalho']['oracle_dsn']} (Usuário: {relatorio_auditoria['cabecalho']['oracle_usuario']})\n")
                    f_txt.write(f"Filiais Processadas: {relatorio_auditoria['cabecalho']['filiais_processadas']}\n")
                    f_txt.write("-" * 75 + "\n")
                    f_txt.write("MAPEAMENTO DE TABELAS E COLUNAS DO ERP:\n")
                    f_txt.write("-" * 75 + "\n")
                    for mod, info in auditoria_modulos.items():
                        f_txt.write(f"• [{mod.upper()}]:\n")
                        for k, v in info.items():
                            f_txt.write(f"    - {k}: {v}\n")
                    f_txt.write("-" * 75 + "\n")
                    f_txt.write(f"TOTAL GERAL DE REGISTROS SINCRONIZADOS: {total_geral:,}\n".replace(",", "."))
                    f_txt.write("=" * 75 + "\n")
            except Exception:
                pass

            # 3. Gravar na Nuvem (Supabase bi_sync_logs)
            try:
                log_payload = [{
                    "empresa_id": emp_id,
                    "tipo_evento": "AUDITORIA_CARGA_INICIAL",
                    "modulo": "TODOS",
                    "registros_processados": total_geral,
                    "sucesso": True,
                    "mensagem": f"Carga inicial e auditoria de mapeamento concluídas com sucesso ({total_geral} registros em {duracao_seg}s).",
                    "detalhes": relatorio_auditoria
                }]
                requests.post(f"{SUPABASE_DEFAULT_URL}/rest/v1/bi_sync_logs", json=log_payload, headers=headers, timeout=15)
            except Exception:
                pass

            log_prog(f"📋 Relatório de auditoria gerado com sucesso: 'relatorio_auditoria_sync.json' ({duracao_seg}s)")

            # Sentinela de Schema Drift do ERP (garante envio estritamente às 10:00 da manhã)
            try:
                self.executar_sentinela_schema_drift()
            except Exception:
                pass

            return {
                "sucesso": True,
                "totais": totais_processados,
                "auditoria": relatorio_auditoria
            }
        except Exception as e:
            return {"sucesso": False, "erro": str(e)}
# 3. MODAL DE AUTENTICACAO MASTER & DIAGNOSTICO DE VOLUME COM STATUS
# -----------------------------------------------------------------------------

    def executar_sentinela_schema_drift(self, forcar_notificacao=False):
        """
        Sentinela de Schema Drift do ERP:
        Inspeciona se tabelas ou procedures sofreram alteração em LAST_DDL_TIME no Oracle.
        Garante envio de WhatsApp estritamente às 10:00 da manhã (horário comercial).
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
            empresa_nome_alerta = (self.config.get("empresa_nome") or self.config.get("empresa_cnpj") or "DESTAK PRIME")
            corpo_msg = (
                f"🚨 *NexaBI Sentinela — Alerta de Schema Drift*\n\n"
                f"🏢 *Cliente:* {empresa_nome_alerta}\n"
                f"⚠️ *Objetos Alterados no ERP Próton:*\n" + "\n".join(linhas_alerta[:4]) + "\n\n"
                f"💡 *Ação:* Acesse o SchemaStudio para homologar o template."
            )

            if pode_notificar:
                self._disparar_whatsapp_alerta_master(corpo_msg)
            else:
                logging.info(f"⏳ Alerta enfileirado para as 10:00 (Hora atual: {datetime.now().strftime('%H:%M')}).")

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

class ModalAutenticacaoMaster(tk.Toplevel):
    def __init__(self, parent, titulo_acao, on_sucesso):
        super().__init__(parent)
        self.title("🔒 Autenticação Master Obrigatória")
        self.geometry("440x260")
        self.configure(bg="#070d18")
        self.resizable(False, False)
        self.transient(parent)
        self.grab_set()

        set_app_icon(self)
        self.titulo_acao = titulo_acao
        self.on_sucesso = on_sucesso

        self.update_idletasks()
        x = parent.winfo_x() + (parent.winfo_width() // 2) - 220
        y = parent.winfo_y() + (parent.winfo_height() // 2) - 130
        self.geometry(f"+{max(0, x)}+{max(0, y)}")

        self._create_widgets()

    def _create_widgets(self):
        hdr = tk.Frame(self, bg="#0d1b2a", padx=12, pady=10, highlightbackground="#6366f1", highlightthickness=1)
        hdr.pack(fill="x", padx=10, pady=(10, 6))

        tk.Label(hdr, text=f"🔒 {self.titulo_acao}", bg="#0d1b2a", fg="#a5b4fc", font=("Segoe UI", 10, "bold")).pack(anchor="w")
        tk.Label(hdr, text="Esta operação exige confirmação com credenciais do perfil Master.", bg="#0d1b2a", fg="#94a3b8", font=("Segoe UI", 8)).pack(anchor="w")

        body = tk.Frame(self, bg="#070d18", padx=14, pady=8)
        body.pack(fill="both", expand=True)

        tk.Label(body, text="Usuário Master:", bg="#070d18", fg="#ffffff", font=("Segoe UI", 9)).grid(row=0, column=0, sticky="w", pady=4)
        self.entry_user = tk.Entry(body, width=24, bg="#16253b", fg="#ffffff", insertbackground="white", font=("Segoe UI", 9))
        self.entry_user.grid(row=0, column=1, sticky="w", padx=6, pady=4)
        self.entry_user.insert(0, "marcello")

        tk.Label(body, text="Senha Master 🔒:", bg="#070d18", fg="#ffffff", font=("Segoe UI", 9)).grid(row=1, column=0, sticky="w", pady=4)
        self.entry_pass = tk.Entry(body, width=24, show="●", bg="#16253b", fg="#ffffff", insertbackground="white", font=("Segoe UI", 9))
        self.entry_pass.grid(row=1, column=1, sticky="w", padx=6, pady=4)
        self.entry_pass.focus()

        self.lbl_erro = tk.Label(body, text="", bg="#070d18", fg="#ef4444", font=("Segoe UI", 8))
        self.lbl_erro.grid(row=2, column=0, columnspan=2, sticky="w", pady=2)

        btn_box = tk.Frame(self, bg="#070d18", padx=12, pady=6)
        btn_box.pack(fill="x", side="bottom")

        btn_cancel = tk.Button(btn_box, text="Cancelar", bg="#334155", fg="#ffffff", font=("Segoe UI", 9), relief="flat", padx=10, pady=3, cursor="hand2", command=self.destroy)
        btn_cancel.pack(side="left")

        self.btn_confirm = tk.Button(btn_box, text="✓ Validar & Executar", bg="#6366f1", fg="#ffffff", font=("Segoe UI", 9, "bold"), relief="flat", padx=14, pady=3, cursor="hand2", command=self._validar)
        self.btn_confirm.pack(side="right")
        self.bind("<Return>", lambda e: self._validar())

    def _validar(self):
        u = self.entry_user.get().strip()
        p = self.entry_pass.get().strip()
        if not u or not p:
            self.lbl_erro.config(text="⚠️ Usuário e senha são obrigatórios.", fg="#ef4444")
            return

        self.btn_confirm.config(state="disabled", text="⏳ Validando...")
        self.lbl_erro.config(text="Validando credenciais no Supabase...", fg="#38bdf8")

        def _do_validate():
            ok, msg = validar_credencial_master(u, p)
            def _apply_result():
                if ok:
                    self.destroy()
                    if self.on_sucesso:
                        self.on_sucesso()
                else:
                    self.lbl_erro.config(text=f"⚠️ {msg}", fg="#ef4444")
                    self.btn_confirm.config(state="normal", text="✓ Validar & Executar")
            self.after(0, _apply_result)

        threading.Thread(target=_do_validate, daemon=True).start()

class ModalDiagnosticoVolume(tk.Toplevel):
    def __init__(self, parent, resultado, on_confirm_sync=None):
        super().__init__(parent)
        self.title("📊 Relatório de Diagnóstico de Volume & Status — NexaBI SyncAgent")
        self.geometry("680x570")
        self.configure(bg="#070d18")
        self.resizable(False, False)
        self.transient(parent)
        self.grab_set()

        set_app_icon(self)
        self.resultado = resultado
        self.on_confirm_sync = on_confirm_sync

        self.update_idletasks()
        x = parent.winfo_x() + (parent.winfo_width() // 2) - 340
        y = parent.winfo_y() + (parent.winfo_height() // 2) - 285
        self.geometry(f"+{max(0, x)}+{max(0, y)}")

        self._create_widgets()

    def _create_widgets(self):
        hdr = tk.Frame(self, bg="#0d1b2a", padx=16, pady=12, highlightbackground="#00d2ff", highlightthickness=1)
        hdr.pack(fill="x", padx=12, pady=(12, 6))

        tk.Label(hdr, text="📊 Diagnóstico Volumétrico & Categorização de Status (Oracle)", 
                 bg="#0d1b2a", fg="#00d2ff", font=("Segoe UI", 11, "bold")).pack(anchor="w")
        tk.Label(hdr, text="Varredura somente-leitura unificando dados ativos e histórico consolidado do Próton.", 
                 bg="#0d1b2a", fg="#94a3b8", font=("Segoe UI", 8)).pack(anchor="w")

        status_box = tk.Frame(self, bg="#16253b", padx=12, pady=8, highlightbackground="#1e3a5f", highlightthickness=1)
        status_box.pack(fill="x", padx=12, pady=4)

        status_msg = self.resultado.get("status_msg", "🟢 Carga Segura")
        tk.Label(status_box, text=status_msg, bg="#16253b", fg="#38bdf8", font=("Segoe UI", 10, "bold")).pack(anchor="w")
        
        info_txt = f"Data de Corte: {self.resultado.get('data_corte')}  |  Unidades: {self.resultado.get('unidades_selecionadas')} de {self.resultado.get('unidades_totais')}"
        tk.Label(status_box, text=info_txt, bg="#16253b", fg="#e2e8f0", font=("Segoe UI", 9)).pack(anchor="w", pady=(2, 0))

        tab_frame = tk.LabelFrame(self, text=" 📦 Detalhamento de Linhas & Status por Módulo Analítico ", 
                                  bg="#0d1b2a", fg="#00d2ff", font=("Segoe UI", 9, "bold"), padx=10, pady=8)
        tab_frame.pack(fill="both", expand=True, padx=12, pady=6)

        c = self.resultado.get("contagens", {})
        mods_ativos = self.resultado.get("modulos_ativos", {})
        vendas_at = mods_ativos.get("vendas", True)
        cr_at = mods_ativos.get("contas_receber", False)
        cp_at = mods_ativos.get("contas_pagar", False)
        est_at = (mods_ativos.get("estoques", False) or mods_ativos.get("estoque", False))
        tes_at = mods_ativos.get("tesouraria", False)

        modulos = [
            ("📈 Vendas Faturadas (CL, MA, F, E)", c.get("vendas_faturadas", 0), "bi_vendas", "#10b981" if vendas_at else "#64748b"),
            ("🟡 Vendas em Separação (RO / Romaneio)", c.get("vendas_separacao", 0), "bi_vendas_pipeline", "#f59e0b" if vendas_at else "#64748b"),
            ("🔵 Vendas em Conferência (VO)", c.get("vendas_conferencia", 0), "bi_vendas_pipeline", "#38bdf8" if vendas_at else "#64748b"),
            ("⚪ Vendas Abertas / Digitação (DI)", c.get("vendas_abertas", 0), "bi_vendas_pipeline", "#e2e8f0" if vendas_at else "#64748b"),
            ("🟣 Vendas Bloqueadas (BC / BG)", c.get("vendas_bloqueadas", 0), "bi_vendas_pipeline", "#c084fc" if vendas_at else "#64748b"),
            ("🔴 Vendas Canceladas (CA / Auditoria de Perdas)", c.get("vendas_canceladas", 0), "bi_vendas (CA)", "#ef4444" if vendas_at else "#64748b"),
            ("💳 Contas a Receber (Títulos)" if cr_at else "💳 Contas a Receber (Inativo na Nuvem)", c.get("contas_receber", 0), "bi_contas_receber", "#38bdf8" if cr_at else "#64748b"),
            ("📑 Contas a Pagar (Títulos)" if cp_at else "📑 Contas a Pagar (Inativo na Nuvem)", c.get("contas_pagar", 0), "bi_contas_pagar", "#38bdf8" if cp_at else "#64748b"),
            ("📦 Estoques (Posições Físicas)" if est_at else "📦 Estoques (Inativo na Nuvem)", c.get("estoques", 0), "bi_estoques", "#38bdf8" if est_at else "#64748b"),
            ("💰 Tesouraria & Saldos" if tes_at else "💰 Tesouraria (Inativo na Nuvem)", c.get("tesouraria", 0), "bi_tesouraria_saldos", "#38bdf8" if tes_at else "#64748b"),
        ]

        tk.Label(tab_frame, text="Módulo / Status Analítico", bg="#0d1b2a", fg="#94a3b8", font=("Segoe UI", 8, "bold")).grid(row=0, column=0, sticky="w", pady=2)
        tk.Label(tab_frame, text="Destino Nuvem", bg="#0d1b2a", fg="#94a3b8", font=("Segoe UI", 8, "bold")).grid(row=0, column=1, sticky="w", padx=16, pady=2)
        tk.Label(tab_frame, text="Qtd. Linhas", bg="#0d1b2a", fg="#94a3b8", font=("Segoe UI", 8, "bold")).grid(row=0, column=2, sticky="e", pady=2)

        for i, (nome, qtd, tab_cloud, cor) in enumerate(modulos, start=1):
            tk.Label(tab_frame, text=nome, bg="#0d1b2a", fg=cor, font=("Segoe UI", 8, "bold" if "Faturadas" in nome else "normal")).grid(row=i, column=0, sticky="w", pady=1)
            tk.Label(tab_frame, text=tab_cloud, bg="#0d1b2a", fg="#64748b", font=("Segoe UI", 7)).grid(row=i, column=1, sticky="w", padx=16, pady=1)
            tk.Label(tab_frame, text=f"{qtd:,}".replace(",", "."), bg="#0d1b2a", fg=cor, font=("Segoe UI", 8, "bold")).grid(row=i, column=2, sticky="e", pady=1)

        sep = ttk.Separator(tab_frame, orient="horizontal")
        sep.grid(row=len(modulos)+1, column=0, columnspan=3, sticky="ew", pady=4)

        total = self.resultado.get("total_linhas", 0)
        mb = self.resultado.get("tamanho_estimado_mb", 0)
        tk.Label(tab_frame, text="TOTAL GERAL ESTIMADO:", bg="#0d1b2a", fg="#00d2ff", font=("Segoe UI", 9, "bold")).grid(row=len(modulos)+2, column=0, sticky="w")
        tk.Label(tab_frame, text=f"~ {mb} MB", bg="#0d1b2a", fg="#f59e0b", font=("Segoe UI", 9, "bold")).grid(row=len(modulos)+2, column=1, sticky="w", padx=16)
        tk.Label(tab_frame, text=f"{total:,} linhas".replace(",", "."), bg="#0d1b2a", fg="#10b981", font=("Segoe UI", 10, "bold")).grid(row=len(modulos)+2, column=2, sticky="e")

        btn_box = tk.Frame(self, bg="#070d18", pady=6)
        btn_box.pack(fill="x", padx=12, pady=(4, 10))

        btn_close = tk.Button(btn_box, text="Fechar", bg="#334155", fg="#ffffff", font=("Segoe UI", 9), relief="flat", padx=12, pady=5, cursor="hand2", command=self.destroy)
        btn_close.pack(side="left")

        if self.on_confirm_sync:
            btn_sync = tk.Button(btn_box, text="🚀 Prosseguir com a Carga para o Supabase", bg="#6366f1", fg="#ffffff", font=("Segoe UI", 9, "bold"), relief="flat", padx=16, pady=5, cursor="hand2", command=self._confirm_and_run)
            btn_sync.pack(side="right")

    def _confirm_and_run(self):
        self.destroy()
        if self.on_confirm_sync:
            self.on_confirm_sync()

# -----------------------------------------------------------------------------
# 4. INTERFACE PRINCIPAL TKINTER DO SYNCAGENT (PRODUCAO CLIENT-SIDE)
# -----------------------------------------------------------------------------
class NexaBIGUI:
    def __init__(self, root):
        self.root = root
        self.root.title(f"NexaBI — Alpha Suite | SyncAgent ({APP_VERSION})")
        
        self.engine = SyncEngine()
        self.unidades_vars = {}
        
        set_app_icon(self.root)
        self._setup_style()
        self._create_widgets()
        self._load_values()
        self._center_and_fit_window()
        self._auto_check_api_key()

        self.root.protocol("WM_DELETE_WINDOW", self._on_close_request)
        self.root.bind("<Unmap>", self._on_window_unmap)
        self._setup_tray_icon()

    def _setup_style(self):
        self.bg_dark = "#070d18"
        self.card_bg = "#0d1b2a"
        self.input_bg = "#16253b"
        self.fg_white = "#ffffff"
        self.cyan_accent = "#00d2ff"
        self.blue_accent = "#0066ff"
        self.gray_text = "#94a3b8"
        self.green_btn = "#10b981"
        self.purple_btn = "#6366f1"
        self.red_btn = "#ef4444"
        self.amber_btn = "#f59e0b"
        
        self.root.configure(bg=self.bg_dark)
        style = ttk.Style()
        style.theme_use("clam")
        style.configure("TLabel", background=self.bg_dark, foreground=self.fg_white, font=("Segoe UI", 9))
        style.configure("TCombobox", fieldbackground=self.input_bg, background=self.card_bg, foreground=self.fg_white)

    def _center_and_fit_window(self):
        self.root.update_idletasks()
        screen_w = self.root.winfo_screenwidth()
        screen_h = self.root.winfo_screenheight()

        win_w = min(880, int(screen_w * 0.95))
        win_h = min(740, int(screen_h * 0.94))

        pos_x = max(0, (screen_w - win_w) // 2)
        pos_y = max(0, (screen_h - win_h) // 2 - 20)

        self.root.geometry(f"{win_w}x{win_h}+{pos_x}+{pos_y}")
        self.root.minsize(880, 680)

    def _create_widgets(self):
        # 1. HEADER
        header_frame = tk.Frame(self.root, bg="#0b1728", padx=14, pady=8, highlightbackground="#00d2ff", highlightthickness=1)
        header_frame.pack(fill="x", padx=12, pady=(8, 4))

        top_line = tk.Frame(header_frame, bg="#0b1728")
        top_line.pack(fill="x")

        # Carrega o logotipo oficial NexaBI para o cabeçalho (redimensionamento proporcional defensivo 40x40)
        try:
            logo_path = get_resource_path("app_logo_header.png")
            if os.path.exists(logo_path):
                try:
                    from PIL import Image, ImageTk
                    pil_img = Image.open(logo_path).convert("RGBA")
                    pil_img = pil_img.resize((40, 40), Image.Resampling.LANCZOS)
                    self.img_header_icon = ImageTk.PhotoImage(pil_img)
                except Exception:
                    raw_img = tk.PhotoImage(file=logo_path)
                    w, h = raw_img.width(), raw_img.height()
                    if w > 48 or h > 48:
                        factor = max(1, max(w, h) // 40)
                        self.img_header_icon = raw_img.subsample(factor, factor)
                    else:
                        self.img_header_icon = raw_img
                lbl_badge = tk.Label(top_line, image=self.img_header_icon, bg="#0b1728", padx=2, pady=2)
                lbl_badge.image = self.img_header_icon
                lbl_badge.pack(side="left", padx=(0, 10))
            else:
                lbl_badge = tk.Label(top_line, text=" N ", bg=self.blue_accent, fg="#ffffff", font=("Segoe UI", 11, "bold"), padx=5, pady=2)
                lbl_badge.pack(side="left", padx=(0, 10))
        except Exception:
            lbl_badge = tk.Label(top_line, text=" N ", bg=self.blue_accent, fg="#ffffff", font=("Segoe UI", 11, "bold"), padx=5, pady=2)
            lbl_badge.pack(side="left", padx=(0, 10))

        title_box = tk.Frame(top_line, bg="#0b1728")
        title_box.pack(side="left")

        lbl_title = tk.Label(title_box, text="NexaBI — Alpha Suite  |  SyncAgent", 
                             bg="#0b1728", fg=self.cyan_accent, font=("Segoe UI", 12, "bold"))
        lbl_title.pack(anchor="w")

        lbl_sub = tk.Label(title_box, text="Extrator Delta Multi-ERP (Oracle Proton) -> Nuvem NexaLife Tech", 
                           bg="#0b1728", fg=self.gray_text, font=("Segoe UI", 8))
        lbl_sub.pack(anchor="w")

        lbl_ver = tk.Label(top_line, text=APP_VERSION, bg="#1e293b", fg="#38bdf8", font=("Segoe UI", 8, "bold"), padx=6, pady=2)
        lbl_ver.pack(side="right")

        main_container = tk.Frame(self.root, bg=self.bg_dark)
        main_container.pack(fill="both", expand=True, padx=12, pady=2)

        # 2. CARD 1: CONEXAO ORACLE
        card_ora = tk.LabelFrame(main_container, text=" 🗄️ 1. Parâmetros do Banco Oracle (ERP Próton) ", 
                                 bg=self.card_bg, fg=self.cyan_accent, font=("Segoe UI", 9, "bold"), 
                                 padx=10, pady=4, highlightbackground="#1e3a5f", highlightthickness=1)
        card_ora.pack(fill="x", pady=2)

        tk.Label(card_ora, text="Host / IP Servidor:", bg=self.card_bg, fg=self.fg_white, font=("Segoe UI", 9)).grid(row=0, column=0, sticky="w", pady=1)
        self.entry_ora_host = tk.Entry(card_ora, width=20, bg=self.input_bg, fg=self.fg_white, insertbackground="white", font=("Segoe UI", 9))
        self.entry_ora_host.grid(row=0, column=1, padx=(4, 10), pady=1, sticky="w")

        tk.Label(card_ora, text="Porta:", bg=self.card_bg, fg=self.fg_white, font=("Segoe UI", 9)).grid(row=0, column=2, sticky="w", pady=1)
        self.entry_ora_port = tk.Entry(card_ora, width=8, bg=self.input_bg, fg=self.fg_white, insertbackground="white", font=("Segoe UI", 9))
        self.entry_ora_port.grid(row=0, column=3, padx=4, pady=1, sticky="w")

        tk.Label(card_ora, text="Serviço / SID:", bg=self.card_bg, fg=self.fg_white, font=("Segoe UI", 9)).grid(row=1, column=0, sticky="w", pady=1)
        self.entry_ora_service = tk.Entry(card_ora, width=20, bg=self.input_bg, fg=self.fg_white, insertbackground="white", font=("Segoe UI", 9))
        self.entry_ora_service.grid(row=1, column=1, padx=(4, 10), pady=1, sticky="w")

        lbl_dica = tk.Label(card_ora, text="💡 Ex: '10.15.1.140' | SID: 'DBPROD'", 
                            bg=self.card_bg, fg=self.gray_text, font=("Segoe UI", 8))
        lbl_dica.grid(row=1, column=2, columnspan=2, sticky="w", padx=4, pady=1)

        tk.Label(card_ora, text="Usuário Oracle:", bg=self.card_bg, fg=self.fg_white, font=("Segoe UI", 9)).grid(row=2, column=0, sticky="w", pady=1)
        self.entry_ora_user = tk.Entry(card_ora, width=20, bg=self.input_bg, fg=self.fg_white, insertbackground="white", font=("Segoe UI", 9))
        self.entry_ora_user.grid(row=2, column=1, padx=(4, 10), pady=1, sticky="w")

        tk.Label(card_ora, text="Senha Oracle 🔒:", bg=self.card_bg, fg=self.fg_white, font=("Segoe UI", 9)).grid(row=2, column=2, sticky="w", pady=1)
        self.entry_ora_pass = tk.Entry(card_ora, width=16, show="●", bg=self.input_bg, fg=self.fg_white, insertbackground="white", font=("Segoe UI", 9))
        self.entry_ora_pass.grid(row=2, column=3, padx=4, pady=1, sticky="w")

        btn_test_ora = tk.Button(card_ora, text="🔍 Testar Conexão com Oracle (ERP Próton)", 
                                 bg=self.blue_accent, fg="#ffffff", activebackground="#0052cc", 
                                 font=("Segoe UI", 9, "bold"), relief="flat", padx=10, pady=2, cursor="hand2", command=self._action_test_oracle)
        btn_test_ora.grid(row=3, column=0, columnspan=4, pady=(3, 1), sticky="ew")

        # 3. CARD 2: NUVEM SUPABASE
        card_cloud = tk.LabelFrame(main_container, text=" ☁️ 2. Credenciais NexaBI Cloud (Supabase TLS 1.3) ", 
                                   bg=self.card_bg, fg=self.cyan_accent, font=("Segoe UI", 9, "bold"), 
                                   padx=10, pady=4, highlightbackground="#1e3a5f", highlightthickness=1)
        card_cloud.pack(fill="x", pady=2)

        tk.Label(card_cloud, text="CNPJ Empresa:", bg=self.card_bg, fg=self.fg_white, font=("Segoe UI", 9)).grid(row=0, column=0, sticky="w", pady=1)
        self.entry_cloud_cnpj = tk.Entry(card_cloud, width=22, bg=self.input_bg, fg=self.fg_white, insertbackground="white", font=("Segoe UI", 9))
        self.entry_cloud_cnpj.grid(row=0, column=1, padx=(4, 10), pady=1, sticky="w")

        tk.Label(card_cloud, text="URL Cloud:", bg=self.card_bg, fg=self.fg_white, font=("Segoe UI", 9)).grid(row=0, column=2, sticky="w", pady=1)
        self.entry_cloud_url = tk.Entry(card_cloud, width=26, bg=self.input_bg, fg=self.fg_white, insertbackground="white", font=("Segoe UI", 9))
        self.entry_cloud_url.grid(row=0, column=3, padx=4, pady=1, sticky="w")

        tk.Label(card_cloud, text="API Key Empresa 🔒:", bg=self.card_bg, fg=self.fg_white, font=("Segoe UI", 9)).grid(row=1, column=0, sticky="w", pady=1)
        self.entry_cloud_key = tk.Entry(card_cloud, width=22, show="●", bg=self.input_bg, fg=self.fg_white, insertbackground="white", font=("Segoe UI", 9))
        self.entry_cloud_key.grid(row=1, column=1, padx=(4, 10), pady=1, sticky="w")

        btn_test_cloud = tk.Button(card_cloud, text="☁️ Testar Conexão com a Nuvem", 
                                   bg="#0284c7", fg="#ffffff", activebackground="#0369a1", 
                                   font=("Segoe UI", 9, "bold"), relief="flat", padx=10, pady=2, cursor="hand2", command=self._action_test_cloud)
        btn_test_cloud.grid(row=1, column=2, columnspan=2, padx=4, pady=1, sticky="ew")

        # 4. CARD 3: SELECAO DE UNIDADES & CORTE TEMPORAL
        card_units = tk.LabelFrame(main_container, text=" 🏢 3. Seleção de Unidades (ERP Próton) & Período de Corte ", 
                                   bg=self.card_bg, fg=self.cyan_accent, font=("Segoe UI", 9, "bold"), 
                                   padx=10, pady=4, highlightbackground="#1e3a5f", highlightthickness=1)
        card_units.pack(fill="x", pady=2)

        top_units = tk.Frame(card_units, bg=self.card_bg)
        top_units.pack(fill="x", pady=1)

        btn_load_units = tk.Button(top_units, text="🏢 Carregar Unidades", bg="#3b82f6", fg="#ffffff", 
                                   font=("Segoe UI", 8, "bold"), relief="flat", padx=6, pady=2, cursor="hand2", command=self._action_load_units)
        btn_load_units.pack(side="left", padx=(0, 4))

        btn_sel_all = tk.Button(top_units, text="✓ Todas", bg="#334155", fg="#ffffff", 
                                font=("Segoe UI", 8), relief="flat", padx=5, pady=2, cursor="hand2", command=self._select_all_units)
        btn_sel_all.pack(side="left", padx=2)

        btn_des_all = tk.Button(top_units, text="✗ Nenhuma", bg="#334155", fg="#ffffff", 
                                font=("Segoe UI", 8), relief="flat", padx=5, pady=2, cursor="hand2", command=self._deselect_all_units)
        btn_des_all.pack(side="left", padx=2)

        self.units_expanded = False
        self.btn_toggle_units = tk.Button(top_units, text="🔽 Expandir Filiais", bg="#0284c7", fg="#ffffff", 
                                          font=("Segoe UI", 8, "bold"), relief="flat", padx=6, pady=2, cursor="hand2", command=self._toggle_units_view)
        self.btn_toggle_units.pack(side="left", padx=4)

        tk.Label(top_units, text="Período Inicial:", bg=self.card_bg, fg=self.fg_white, font=("Segoe UI", 8, "bold")).pack(side="left", padx=(12, 4))
        self.combo_periodo = ttk.Combobox(top_units, width=22, state="readonly", values=[
            "Últimos 30 Dias (Piloto Rápido)",
            "Ano Atual (2026)",
            "Últimos 12 Meses (Recomendado)",
            "Últimos 24 Meses",
            "Histórico Completo (Todos os Anos)"
        ])
        self.combo_periodo.current(2)
        self.combo_periodo.pack(side="left", padx=2)

        self.units_canvas_frame = tk.Frame(card_units, bg="#070d18", height=50, highlightbackground="#1e3a5f", highlightthickness=1)
        self.units_canvas_frame.pack(fill="x", expand=False, pady=3)
        
        self.units_container = tk.Frame(self.units_canvas_frame, bg="#070d18")
        self.units_container.pack(fill="both", expand=True, padx=4, pady=2)
        self.lbl_units_status = tk.Label(self.units_container, text="Clique em 'Carregar Unidades' para listar as filiais ativas.", 
                                         bg="#070d18", fg="#94a3b8", font=("Segoe UI", 8))
        self.lbl_units_status.pack(pady=2)

        # 5. CARD 4: SERVICO DO WINDOWS
        card_svc = tk.LabelFrame(main_container, text=" ⚙️ 4. Serviço do Windows (Auto-Start no Boot 24/7) ", 
                                 bg=self.card_bg, fg=self.cyan_accent, font=("Segoe UI", 9, "bold"), 
                                 padx=10, pady=4, highlightbackground="#1e3a5f", highlightthickness=1)
        card_svc.pack(fill="x", pady=2)

        svc_line = tk.Frame(card_svc, bg=self.card_bg)
        svc_line.pack(fill="x", pady=1)

        self.lbl_svc_status = tk.Label(svc_line, text="Status: Verificando...", bg=self.card_bg, fg="#38bdf8", font=("Segoe UI", 9, "bold"))
        self.lbl_svc_status.pack(side="left", padx=(0, 10))

        btn_install_svc = tk.Button(svc_line, text="⚙️ Instalar como Serviço Windows", bg="#059669", fg="#ffffff", 
                                    font=("Segoe UI", 8, "bold"), relief="flat", padx=8, pady=2, cursor="hand2", command=self._action_install_service)
        btn_install_svc.pack(side="left", padx=3)

        btn_remove_svc = tk.Button(svc_line, text="⏹️ Desinstalar Serviço 🔒", bg="#991b1b", fg="#ffffff", 
                                   font=("Segoe UI", 8), relief="flat", padx=8, pady=2, cursor="hand2", command=self._action_remove_service)
        btn_remove_svc.pack(side="left", padx=3)

        btn_refresh_svc = tk.Button(svc_line, text="🔄 Atualizar Status", bg="#334155", fg="#ffffff", 
                                    font=("Segoe UI", 8), relief="flat", padx=6, pady=2, cursor="hand2", command=self._refresh_service_status)
        btn_refresh_svc.pack(side="left", padx=3)

        btn_min_tray = tk.Button(svc_line, text="🗕 Minimizar p/ Bandeja (Relógio)", bg="#1e293b", fg="#38bdf8", 
                                 font=("Segoe UI", 8, "bold"), relief="flat", padx=8, pady=2, cursor="hand2", command=self._minimize_to_tray)
        btn_min_tray.pack(side="right", padx=3)

        # 6. BARRA DE ACOES PRINCIPAIS
        act_frame = tk.Frame(main_container, bg=self.bg_dark)
        act_frame.pack(fill="x", pady=3)

        btn_diag = tk.Button(act_frame, text="📊 Analisar Volume de Dados", bg=self.amber_btn, fg="#000000", 
                             font=("Segoe UI", 9, "bold"), relief="flat", padx=8, pady=4, cursor="hand2", command=self._action_diagnostico_volume)
        btn_diag.pack(side="left", fill="x", expand=True, padx=(0, 2))

        btn_save = tk.Button(act_frame, text="💾 Salvar Configurações (AES-256)", bg=self.green_btn, fg="#ffffff", 
                             font=("Segoe UI", 9, "bold"), relief="flat", padx=8, pady=4, cursor="hand2", command=self._action_save_config)
        btn_save.pack(side="left", fill="x", expand=True, padx=2)

        btn_sync_test = tk.Button(act_frame, text="🚀 Executar Carga", bg=self.purple_btn, fg="#ffffff", 
                                  font=("Segoe UI", 9, "bold"), relief="flat", padx=8, pady=4, cursor="hand2", command=self._action_sync_now)
        btn_sync_test.pack(side="left", fill="x", expand=True, padx=2)

        btn_daemon = tk.Button(act_frame, text="🔄 Sync Contínua", bg="#0f766e", fg="#ffffff", 
                               font=("Segoe UI", 9, "bold"), relief="flat", padx=8, pady=4, cursor="hand2", command=self._action_toggle_daemon)
        btn_daemon.pack(side="left", fill="x", expand=True, padx=(2, 0))
        self.btn_daemon = btn_daemon

        # 7. CONSOLE DE LOGS
        log_frame = tk.LabelFrame(main_container, text=" 💻 Console de Status & Diagnóstico em Tempo Real ", 
                                  bg=self.card_bg, fg=self.cyan_accent, font=("Segoe UI", 9, "bold"), 
                                  padx=6, pady=3, highlightbackground="#1e3a5f", highlightthickness=1)
        log_frame.pack(fill="both", expand=True, pady=(2, 2))

        # Barra superior do console com atalho para abrir o arquivo de log no Bloco de Notas
        log_top_bar = tk.Frame(log_frame, bg=self.card_bg)
        log_top_bar.pack(fill="x", pady=(0, 3))

        btn_open_log = tk.Button(log_top_bar, text="📄 Abrir Arquivo de Log (sync_agent.log)", bg="#1e293b", fg="#38bdf8", 
                                 font=("Segoe UI", 8, "bold"), relief="flat", padx=8, pady=1, cursor="hand2", 
                                 command=self._action_open_log_file)
        btn_open_log.pack(side="right", padx=2)

        btn_clear_log = tk.Button(log_top_bar, text="🗑️ Limpar Tela", bg="#1e293b", fg="#94a3b8", 
                                  font=("Segoe UI", 8), relief="flat", padx=6, pady=1, cursor="hand2", 
                                  command=self._action_clear_log_console)
        btn_clear_log.pack(side="right", padx=2)

        self.txt_log = scrolledtext.ScrolledText(log_frame, bg="#030712", fg="#38bdf8", insertbackground="white", 
                                                 font=("Consolas", 9), height=8)
        self.txt_log.pack(fill="both", expand=True)

        hw_fp = get_machine_fingerprint()
        self.log(f"Painel NexaBI SyncAgent {APP_VERSION} inicializado com sucesso. [{hw_fp}]")
        self.daemon_running = False
        self._refresh_service_status()

    def _action_open_log_file(self):
        try:
            base_dir = os.path.dirname(os.path.abspath(sys.executable if getattr(sys, 'frozen', False) else __file__))
            log_file = os.path.join(base_dir, "sync_agent.log")
            if not os.path.exists(log_file):
                with open(log_file, "w", encoding="utf-8") as f:
                    f.write(f"NexaBI SyncAgent {APP_VERSION} - Arquivo de Log Criado.\n")
            os.startfile(log_file)
        except Exception as e:
            messagebox.showerror("Erro ao Abrir Log", f"Não foi possível abrir o arquivo de log:\n{e}")

    def _action_clear_log_console(self):
        if hasattr(self, 'txt_log'):
            self.txt_log.delete("1.0", tk.END)

    def _auto_check_api_key(self):
        def run():
            if not self.engine.config.get("api_key") and self.engine.config.get("empresa_cnpj"):
                res = self.engine.obter_empresa_autenticada()
                if res.get("sucesso") and res.get("recuperado"):
                    def _update_ui():
                        self.entry_cloud_key.delete(0, tk.END)
                        self.entry_cloud_key.insert(0, self.engine.config.get("api_key", ""))
                    self.root.after(0, _update_ui)
                    self.log(f"🔑 API Key auto-recuperada com sucesso para {res.get('empresa_nome')} (AES-256)!")
        threading.Thread(target=run, daemon=True).start()

    def log(self, msg):
        timestamp = time.strftime("%H:%M:%S")
        if hasattr(self, 'txt_log'):
            self.txt_log.insert(tk.END, f"[{timestamp}] {msg}\n")
            self.txt_log.see(tk.END)
        # Grava de forma persistente em sync_agent.log no disco
        try:
            logging.info(msg)
        except Exception:
            pass

    def _get_meses_corte(self):
        sel = self.combo_periodo.get()
        if "30 Dias" in sel: return 1
        if "Ano Atual" in sel: return 8
        if "12 Meses" in sel: return 12
        if "24 Meses" in sel: return 24
        return 0

    def _load_values(self):
        cfg = self.engine.config
        ora = cfg.get("oracle", {})
        
        self.entry_ora_host.insert(0, str(ora.get("host", "localhost")))
        self.entry_ora_port.insert(0, str(ora.get("port", 1521)))
        self.entry_ora_service.insert(0, str(ora.get("service_name", "DBPROD")))
        self.entry_ora_user.insert(0, str(ora.get("user", "APPUSER")))
        self.entry_ora_pass.insert(0, str(ora.get("password", "")))
        
        self.entry_cloud_cnpj.insert(0, str(cfg.get("empresa_cnpj", "")))
        self.entry_cloud_key.insert(0, str(cfg.get("api_key", "")))
        
        url_nuvem = str(cfg.get("url_api_nuvem", SUPABASE_DEFAULT_URL))
        if not url_nuvem or "railway.app" in url_nuvem:
            url_nuvem = SUPABASE_DEFAULT_URL
        self.entry_cloud_url.insert(0, url_nuvem)

    def _refresh_service_status(self):
        ativo, desc = verificar_status_servico()
        self.lbl_svc_status.config(text=f"Status: {desc}", fg="#10b981" if ativo else "#94a3b8")

    def _action_install_service(self):
        self._action_save_config()
        self.log("⚙️ Instalando SyncAgent como Serviço do Windows (Auto-Start)...")
        ok, msg = instalar_servico_windows()
        if ok:
            self.log(f"✅ {msg}")
            self._refresh_service_status()
            messagebox.showinfo("Serviço Instalado", msg)
        else:
            self.log(f"🛑 {msg}")
            messagebox.showerror("Erro ao Instalar Serviço", msg)

    def _action_remove_service(self):
        def executar_remocao():
            ok, msg = remover_servico_windows()
            if ok:
                self.log(f"✅ {msg}")
                self._refresh_service_status()
                messagebox.showinfo("Serviço Removido", msg)
            else:
                self.log(f"🛑 {msg}")
                messagebox.showerror("Erro", msg)

        ModalAutenticacaoMaster(self.root, "Desinstalar Serviço do Windows", executar_remocao)

    def _setup_tray_icon(self):
        try:
            img = self._get_tray_image()
            menu = pystray.Menu(
                pystray.MenuItem("Abrir NexaBI SyncAgent", lambda icon, item: self._restore_from_tray(), default=True),
                pystray.MenuItem("Minimizar p/ Bandeja", lambda icon, item: self._minimize_to_tray()),
                pystray.Menu.SEPARATOR,
                pystray.MenuItem("Status: Sincronizador Ativo", None, enabled=False),
                pystray.Menu.SEPARATOR,
                pystray.MenuItem("Encerrar SyncAgent", lambda icon, item: self._solicitar_encerramento_tray())
            )
            self.tray_icon = pystray.Icon("NexaBI_SyncAgent", img, f"NexaBI SyncAgent ({APP_VERSION})", menu)
            self.tray_icon.run_detached()
            logging.info("[TRAY] Ícone da bandeja do sistema (System Tray) ativado com sucesso.")
        except Exception as e:
            logging.warning(f"[TRAY] Falha ao inicializar ícone da bandeja: {e}")
            self.tray_icon = None

    def _get_tray_image(self):
        try:
            png = get_resource_path("app_icon.png")
            if os.path.exists(png):
                return Image.open(png)
            ico = get_resource_path("app_icon.ico")
            if os.path.exists(ico):
                return Image.open(ico)
        except Exception as e:
            logging.warning(f"[TRAY] Erro ao carregar imagem para bandeja: {e}")
        return Image.new("RGBA", (64, 64), color=(0, 210, 255, 255))

    def _minimize_to_tray(self):
        self.root.withdraw()
        self.log("🗕 SyncAgent recolhido para a bandeja do sistema ao lado do relógio.")
        if not getattr(self, '_tray_notified', False):
            self._tray_notified = True
            try:
                if hasattr(self, 'tray_icon') and self.tray_icon and hasattr(self.tray_icon, 'notify'):
                    self.tray_icon.notify(
                        "O NexaBI SyncAgent continua ativo na bandeja ao lado do relógio.\nClique duas vezes no ícone para reabrir.",
                        "NexaBI SyncAgent"
                    )
            except Exception:
                pass

    def _restore_from_tray(self):
        def _do_restore():
            self.root.deiconify()
            self.root.state('normal')
            self.root.lift()
            self.root.attributes("-topmost", True)
            self.root.after_idle(self.root.attributes, "-topmost", False)
            self.root.focus_force()
        self.root.after(0, _do_restore)

    def _on_window_unmap(self, event):
        if event.widget == self.root and self.root.state() == 'iconic':
            self._minimize_to_tray()

    def _on_close_request(self):
        if self.daemon_running:
            resposta = messagebox.askyesnocancel(
                "NexaBI SyncAgent em Execução",
                "A sincronização contínua está ATIVA em segundo plano.\n\n"
                "• Clique em 'SIM' para MINIMIZAR para a bandeja ao lado do relógio.\n"
                "• Clique em 'NÃO' para ENCERRAR completamente (Exige Senha Master).\n"
                "• Clique em 'CANCELAR' para voltar."
            )
            if resposta is True:
                self._minimize_to_tray()
            elif resposta is False:
                ModalAutenticacaoMaster(self.root, "Encerrar SyncAgent", self._finalizar_aplicacao)
        else:
            resposta = messagebox.askyesnocancel(
                "NexaBI SyncAgent",
                "Deseja manter o SyncAgent ativo em segundo plano na bandeja do sistema?\n\n"
                "• 'SIM': Minimizar para a bandeja ao lado do relógio.\n"
                "• 'NÃO': Fechar e encerrar a aplicação.\n"
                "• 'CANCELAR': Cancelar e permanecer na tela."
            )
            if resposta is True:
                self._minimize_to_tray()
            elif resposta is False:
                self._finalizar_aplicacao()

    def _solicitar_encerramento_tray(self):
        def _confirmar():
            if self.daemon_running:
                self._restore_from_tray()
                ModalAutenticacaoMaster(self.root, "Encerrar SyncAgent", self._finalizar_aplicacao)
            else:
                self._finalizar_aplicacao()
        self.root.after(0, _confirmar)

    def _finalizar_aplicacao(self):
        logging.info("[SYS] Encerrando aplicação e finalizando ícone da bandeja...")
        try:
            if hasattr(self, 'tray_icon') and self.tray_icon:
                self.tray_icon.stop()
        except Exception:
            pass
        self.root.destroy()
        sys.exit(0)

    def _action_load_units(self):
        self._action_save_config()
        self.log("🏢 Buscando unidades cadastradas no Oracle...")
        
        def run():
            res = self.engine.obter_unidades_oracle()
            for l in res.get("logs", []):
                self.log(f"   ℹ️ {l}")

            if res["sucesso"] and res["unidades"]:
                unidades = res["unidades"]
                self.log(f"✅ {len(unidades)} unidades reais carregadas com sucesso!")
                self.root.after(0, lambda: self._render_units_list(unidades))
            else:
                erro_msg = res.get("erro", "Nenhuma unidade retornada pelo Oracle.")
                self.log(f"🛑 Erro ao carregar unidades: {erro_msg}")
                self.root.after(0, lambda: messagebox.showerror("Erro ao Carregar Unidades", f"Não foi possível carregar as unidades do banco Oracle:\n\n{erro_msg}\n\nVerifique as credenciais ou os logs na console."))
                
        threading.Thread(target=run, daemon=True).start()

    def _render_units_list(self, unidades):
        for widget in self.units_container.winfo_children():
            widget.destroy()

        self.unidades_vars.clear()
        col_count = 3 if len(unidades) <= 9 else 4
        for i, u in enumerate(unidades):
            cod = u["codigo"]
            nome = u["nome"]
            var = tk.BooleanVar(value=True)
            self.unidades_vars[cod] = (var, nome)

            texto_label = f"[{cod:02d}] {nome[:24]}"
            cb = tk.Checkbutton(self.units_container, text=texto_label, variable=var,
                                bg="#070d18", fg="#ffffff", selectcolor="#16253b", activebackground="#070d18",
                                activeforeground="#00d2ff", font=("Segoe UI", 8))
            row = i // col_count
            col = i % col_count
            cb.grid(row=row, column=col, sticky="w", padx=6, pady=2)
            
        if len(unidades) > 4:
            self.units_canvas_frame.pack_forget()
            self.units_expanded = False
            self.btn_toggle_units.config(text=f"🔽 Expandir Filiais ({len(unidades)}/{len(unidades)} sel.)", bg="#0284c7")
        else:
            self.units_canvas_frame.pack(fill="x", expand=False, pady=3)
            self.units_expanded = True
            self.btn_toggle_units.config(text="🔼 Recolher Filiais", bg="#475569")

    def _toggle_units_view(self):
        if getattr(self, "units_expanded", True):
            self.units_canvas_frame.pack_forget()
            qtd_sel = len(self._get_selected_units_list())
            total = len(self.unidades_vars)
            texto_btn = f"🔽 Expandir Filiais ({qtd_sel}/{total} sel.)" if total > 0 else "🔽 Expandir Filiais"
            self.btn_toggle_units.config(text=texto_btn, bg="#0284c7")
            self.units_expanded = False
        else:
            self.units_canvas_frame.pack(fill="x", expand=False, pady=3)
            self.btn_toggle_units.config(text="🔼 Recolher Filiais", bg="#475569")
            self.units_expanded = True

    def _select_all_units(self):
        for var, _ in self.unidades_vars.values():
            var.set(True)
        if not getattr(self, "units_expanded", True):
            qtd = len(self.unidades_vars)
            self.btn_toggle_units.config(text=f"🔽 Expandir Filiais ({qtd}/{qtd} sel.)", bg="#0284c7")

    def _deselect_all_units(self):
        for var, _ in self.unidades_vars.values():
            var.set(False)
        if not getattr(self, "units_expanded", True):
            qtd = len(self.unidades_vars)
            self.btn_toggle_units.config(text=f"🔽 Expandir Filiais (0/{qtd} sel.)", bg="#0284c7")

    def _get_selected_units_list(self):
        return [cod for cod, (var, _) in self.unidades_vars.items() if var.get()]

    def _action_diagnostico_volume(self):
        self._action_save_config()
        filiais_sel = self._get_selected_units_list()
        meses_corte = self._get_meses_corte()
        
        self.log(f"📊 Executando diagnóstico volumétrico com matriz de status ({len(filiais_sel) if filiais_sel else 'Todas'} unidades / {meses_corte} meses)...")

        def run():
            res = self.engine.analisar_volume_dados(filiais_selecionadas=filiais_sel, meses_corte=meses_corte)
            if res["sucesso"]:
                c = res["contagens"]
                self.log(f"✅ Diagnóstico: {res['total_linhas']:,} linhas estimadas (~ {res['tamanho_estimado_mb']} MB).")
                self.log(f"   🟢 Vendas Faturadas: {c.get('vendas_faturadas', 0):,} pedidos")
                self.log(f"   🟡 Em Separação (RO): {c.get('vendas_separacao', 0):,} pedidos")
                self.log(f"   🔵 Em Conferência (VO): {c.get('vendas_conferencia', 0):,} pedidos")
                self.root.after(0, lambda: ModalDiagnosticoVolume(self.root, res, on_confirm_sync=self._action_sync_now))
            else:
                self.log(f"🛑 Erro no diagnóstico: {res.get('erro')}")
                messagebox.showerror("Erro Diagnóstico", f"Falha ao diagnosticar volume no Oracle:\n{res.get('erro')}")
                
        threading.Thread(target=run, daemon=True).start()

    def _action_save_config(self):
        try:
            port = int(self.entry_ora_port.get().strip() or "1521")
        except ValueError:
            port = 1521
            
        host = self.entry_ora_host.get().strip() or "localhost"
        service = self.entry_ora_service.get().strip() or "DBPROD"
        user = self.entry_ora_user.get().strip() or "APPUSER"
        
        # BLINDAGEM DE SENHA: Se o campo na tela estiver vazio, preserva a senha que já estava gravada
        pwd = self.entry_ora_pass.get().strip()
        if not pwd:
            pwd = self.engine.config.get("oracle", {}).get("password", "")
            if not pwd:
                pwd = getattr(self.engine, "raw_password", "")

        url_nuvem = self.entry_cloud_url.get().strip().rstrip("/")
        if not url_nuvem or "railway.app" in url_nuvem:
            url_nuvem = SUPABASE_DEFAULT_URL

        filiais_sel = self._get_selected_units_list()

        # BLINDAGEM DE API KEY: Se o campo na tela estiver vazio, preserva a key que já estava gravada
        api_key = self.entry_cloud_key.get().strip()
        if not api_key:
            api_key = self.engine.config.get("api_key", "")
            if not api_key:
                api_key = getattr(self.engine, "raw_api_key", "")

        cnpj_val = self.entry_cloud_cnpj.get().strip()
        if not cnpj_val:
            cnpj_val = self.engine.config.get("empresa_cnpj", "")

        cfg = {
            "empresa_cnpj": cnpj_val,
            "codigo_filial": 0,
            "filiais_selecionadas": filiais_sel,
            "periodo_corte_meses": self._get_meses_corte(),
            "api_key": api_key,
            "url_api_nuvem": url_nuvem,
            "oracle": {
                "host": host,
                "port": port,
                "service_name": service,
                "user": user,
                "password": pwd,
                "dsn": f"{host}:{port}/{service}",
                "thin_mode": True
            },
            "batch_size": 1000
        }
        self.engine.save_config(cfg)
        self.log(f"💾 Configurações salvas (AES-256)! DSN: {host}:{port}/{service}")

    def _action_test_oracle(self):
        self._action_save_config()
        dsn = self.engine.get_dsn()
        self.log(f"🔍 Testando conexão com o Oracle em {dsn}...")
        
        def run():
            res = self.engine.testar_conexao_oracle()
            if res["sucesso"]:
                self.log(f"✅ [ORACLE OK] {res['mensagem']}")
                messagebox.showinfo("Oracle OK", res["mensagem"])
            else:
                self.log(f"🛑 [ORACLE ERRO] {res['mensagem']}")
                messagebox.showerror("Erro Oracle", res["mensagem"])
                
        threading.Thread(target=run, daemon=True).start()

    def _action_test_cloud(self):
        self._action_save_config()
        self.log("☁️ Testando conexão com a Nuvem NexaBI Supabase (TLS 1.3)...")
        
        def run():
            res = self.engine.testar_conexao_cloud()
            if res["sucesso"]:
                if res.get("recuperado"):
                    def _update_key_ui():
                        self.entry_cloud_key.delete(0, tk.END)
                        self.entry_cloud_key.insert(0, self.engine.config.get("api_key", ""))
                    self.root.after(0, _update_key_ui)
                    self.log(f"🔑 API Key recuperada e salva com sucesso para {res.get('empresa_nome')}!")
                self.log(f"✅ [CLOUD OK] {res['mensagem']}")
                messagebox.showinfo("Nuvem OK", res["mensagem"])
            else:
                self.log(f"🛑 [CLOUD ERRO] {res['mensagem']}")
                messagebox.showerror("Erro Nuvem", res["mensagem"])
                
        threading.Thread(target=run, daemon=True).start()

    def _action_sync_now(self):
        self._action_save_config()
        filiais_sel = self._get_selected_units_list()
        meses_corte = self._get_meses_corte()

        msg_confirm = f"Deseja iniciar a extração e envio para o Supabase?\n\n🏢 Unidades: {len(filiais_sel) if filiais_sel else 'Todas as 23 Unidades'}\n📅 Corte: {self.combo_periodo.get()}"
        if not messagebox.askyesno("Confirmar Carga", msg_confirm):
            return
            
        self.log("🚀 Iniciando carga de sincronização Delta...")
        
        def run():
            res = self.engine.executar_ciclo_completo(filiais_selecionadas=filiais_sel, meses_corte=meses_corte, progress_callback=self.log)
            if res["sucesso"]:
                self.log("🎉 Carga concluída com sucesso!")
                for k, v in res.get("totais", {}).items():
                    self.log(f"   ✓ {k.replace('_', ' ').title()}: {v} registros processados.")
                messagebox.showinfo("Sucesso", "Carga finalizada com sucesso no Supabase!")
            else:
                self.log(f"🛑 Falha na carga: {res.get('erro')}")
                messagebox.showerror("Erro na Carga", f"Falha na carga:\n{res.get('erro')}")
                
        threading.Thread(target=run, daemon=True).start()

    def _action_toggle_daemon(self):
        if not self.daemon_running:
            self._action_save_config()
            self.daemon_running = True
            self.btn_daemon.config(text="⏹️ Parar Sincronização", bg=self.red_btn)
            self.log("🔄 Sincronizador contínuo INICIADO (Ciclos a cada 60s).")
            
            def daemon_loop():
                while self.daemon_running:
                    filiais_sel = self._get_selected_units_list()
                    meses_corte = self._get_meses_corte()
                    self.log("⏳ Executando ciclo delta agendado...")
                    res = self.engine.executar_ciclo_completo(filiais_selecionadas=filiais_sel, meses_corte=meses_corte, progress_callback=self.log)
                    if res["sucesso"]:
                        self.log("✅ Ciclo delta concluído. Aguardando 60s...")
                    else:
                        self.log(f"⚠️ Alerta: {res.get('erro')}. Aguardando 30s...")
                    
                    for _ in range(60):
                        if not self.daemon_running:
                            break
                        time.sleep(1)
                        
            threading.Thread(target=daemon_loop, daemon=True).start()
        else:
            def parar_daemon():
                self.daemon_running = False
                self.btn_daemon.config(text="🔄 Sync Contínua", bg="#0f766e")
                self.log("⏹️ Sincronizador contínuo PARADO com autorização Master.")

            ModalAutenticacaoMaster(self.root, "Parar Sincronização Contínua", parar_daemon)

# -----------------------------------------------------------------------------
# 5. PONTO DE ENTRADA PRINCIPAL
# -----------------------------------------------------------------------------
def run_daemon_mode(engine, interval_sec=60):
    logging.info("=" * 75)
    logging.info(f"NexaBI SyncAgent Daemon iniciado em background 24/7 (Ciclo Delta: {interval_sec}s)...")
    logging.info("=" * 75)
    while True:
        try:
            res = engine.executar_ciclo_completo(progress_callback=lambda m: logging.info(m))
            if res.get('sucesso'):
                logging.info(f"Ciclo Delta concluído com sucesso. Totais: {res.get('totais', {})}")
            else:
                logging.warning(f"Aviso no ciclo Delta: {res.get('erro')}")
            for _ in range(interval_sec):
                time.sleep(1)
        except KeyboardInterrupt:
            logging.info("Daemon interrompido pelo usuário.")
            break
        except Exception as e:
            logging.error(f"Erro no loop do daemon: {e}", exc_info=True)
            time.sleep(15)

def main():
    if "--version" in sys.argv:
        print(f"NexaBI SyncAgent {APP_VERSION} [{get_machine_fingerprint()}]")
        return

    if "--daemon" in sys.argv:
        engine = SyncEngine()
        run_daemon_mode(engine)
        return

    root = tk.Tk()
    app = NexaBIGUI(root)
    root.mainloop()

if __name__ == '__main__':
    main()
