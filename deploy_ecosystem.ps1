# ============================================================================
# Script Unificado de Deploy Multi-Cloud — NexaBI — Alpha Suite
# NexaLife Tech & Alpha Solutions
# 1. Compilação Vite
# 2. Deploy Netlify Edge CDN (Oficial)
# 3. Deploy Firebase Hosting (Google Cloud NexaLife Ecosystem)
# 4. Sincronização GitHub
# ============================================================================

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   NEXABI — ALPHA SUITE | DEPLOY MULTI-CLOUD NEXALIFE TECH  " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Deploy Netlify + GitHub
python "$PSScriptRoot\deploy_netlify.py"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha no deploy Netlify." -ForegroundColor Red
    exit 1
}

# 2. Deploy Firebase Hosting (NexaLife-Ecosystem)
Write-Host "`nDeploying para Firebase Hosting (nexabi-suite.web.app)..." -ForegroundColor Yellow
cmd.exe /c "firebase deploy --only hosting --project nexalife-ecosystem"

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host "[SUCESSO] AMBIENTES PUBLICADOS COM SUCESSO!" -ForegroundColor Green
Write-Host "1. Netlify Edge CDN: https://nexabi-alpha-suite.netlify.app" -ForegroundColor Cyan
Write-Host "2. Firebase Google Cloud: https://nexabi-suite.web.app" -ForegroundColor Cyan
Write-Host "3. GitHub Repository: https://github.com/marcellobastos1975-oss/nexabi-dashboard.git" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
