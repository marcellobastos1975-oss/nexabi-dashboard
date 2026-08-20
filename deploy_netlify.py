"""
Script Oficial de Deploy do NexaBI — Alpha Suite no Netlify
Garante compatibilidade POSIX (forward slashes) para a nuvem Linux do Netlify
"""
import os
import sys
import zipfile
import subprocess
import requests

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

SITE_ID = "50e56638-b7cb-432c-9043-33dfca1ebbbb"
NETLIFY_PAT = "nfp_nxGPxFoaiRi4ojnp11ZLdnzbk1N7nXeXd0f5"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, "dist")
ZIP_PATH = os.path.join(BASE_DIR, "dist.zip")

print("=" * 60)
print("[NEXABI] DEPLOY OFICIAL NEXABI - ALPHA SUITE (NETLIFY API)")
print("=" * 60)

# 1. Build
print("1. Compilando o frontend React (npm run build)...")
res = subprocess.run("npm run build", shell=True, cwd=BASE_DIR)
if res.returncode != 0:
    print("[ERRO] Falha na compilacao. Deploy abortado.")
    sys.exit(1)

# 2. Criar ZIP com caminhos POSIX (forward slash '/')
print("2. Empacotando dist.zip com compatibilidade Linux/POSIX...")
if os.path.exists(ZIP_PATH):
    os.remove(ZIP_PATH)

with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(DIST_DIR):
        for f in files:
            abs_file = os.path.join(root, f)
            rel_file = os.path.relpath(abs_file, DIST_DIR).replace("\\", "/")
            z.write(abs_file, rel_file)
            print(f"   -> [ZIP] {rel_file}")

# 3. Upload para a API do Netlify
print("\n3. Enviando dist.zip para a API do Netlify...")
with open(ZIP_PATH, "rb") as f:
    headers = {
        "Content-Type": "application/zip",
        "Authorization": f"Bearer {NETLIFY_PAT}"
    }
    url = f"https://api.netlify.com/api/v1/sites/{SITE_ID}/deploys"
    r = requests.post(url, headers=headers, data=f)

if r.status_code in (200, 201):
    deploy_data = r.json()
    deploy_id = deploy_data.get("id")
    state = deploy_data.get("state")
    ssl_url = deploy_data.get("ssl_url")
    print(f"[SUCESSO] Upload concluido! Deploy ID: {deploy_id} | Status: {state}")
    print(f"Site Online: {ssl_url}")
else:
    print(f"[ERRO] Erro no deploy Netlify ({r.status_code}): {r.text}")
    sys.exit(1)

# 4. Sincronizar com GitHub
print("\n4. Sincronizando com o GitHub...")
subprocess.run("git add -A", shell=True, cwd=BASE_DIR)
subprocess.run('git commit -m "deploy: netlify posix zip fix and _redirects"', shell=True, cwd=BASE_DIR)
subprocess.run("git push origin master", shell=True, cwd=BASE_DIR)

print("\n" + "=" * 60)
print("[PRONTO] DEPLOY PUBLICADO COM SUCESSO NO NETLIFY!")
print(f"URL Oficial: https://nexabi-alpha-suite.netlify.app")
print("=" * 60)
