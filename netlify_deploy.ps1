# ============================================================================
# Script Oficial de Deploy do NexaBI — Alpha Suite no Netlify
# NexaLife Tech & Alpha Solutions
# Uso: .\netlify_deploy.ps1
# ============================================================================

$SITE_ID = "50e56638-b7cb-432c-9043-33dfca1ebbbb"
$NETLIFY_PAT = "nfp_nxGPxFoaiRi4ojnp11ZLdnzbk1N7nXeXd0f5"
$DIST_DIR = "$PSScriptRoot\dist"
$ZIP_PATH = "$PSScriptRoot\dist.zip"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " 🚀 DEPLOY OFICIAL NEXABI — ALPHA SUITE (NETLIFY) " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

Write-Host "1. Compilando o projeto React/Vite (npm run build)..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERRO: Build falhou! Deploy cancelado." -ForegroundColor Red
    exit 1
}

Write-Host "2. Empacotando dist.zip para upload via API Netlify..." -ForegroundColor Yellow
if (Test-Path $ZIP_PATH) {
    Remove-Item $ZIP_PATH -Force
}
Compress-Archive -Path "$DIST_DIR\*" -DestinationPath $ZIP_PATH -Force

Write-Host "3. Enviando pacote para a API Netlify (Site: $SITE_ID)..." -ForegroundColor Yellow
$response = curl.exe -s -H "Content-Type: application/zip" -H "Authorization: Bearer $NETLIFY_PAT" --data-binary "@$ZIP_PATH" "https://api.netlify.com/api/v1/sites/$SITE_ID/deploys"

Write-Host "4. Sincronizando com repositório GitHub..." -ForegroundColor Yellow
git add -A
git commit -m "deploy(prod): atualizacao do build no Netlify v1.2.0"
git push origin master

Write-Host ""
Write-Host "✅ DEPLOY CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "🌐 Site Oficial Online: https://nexabi-alpha-suite.netlify.app" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
