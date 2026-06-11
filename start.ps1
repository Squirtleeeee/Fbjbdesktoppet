# 菲比桌宠启动脚本
# 注意: 必须在 PowerShell 中运行，会自动清除 ELECTRON_RUN_AS_NODE

param(
  [switch]$NoBuild  # 跳过构建
)

$ErrorActionPreference = "Stop"

# 清除导致 Electron 降级的环境变量
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

if (-not $NoBuild) {
  Write-Host "Building..." -ForegroundColor Cyan
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "Build failed" }
}

Write-Host "Starting 菲比桌宠..." -ForegroundColor Green

# 用 electron.exe 直接启动
& "$projectDir\node_modules\electron\dist\electron.exe" $projectDir
