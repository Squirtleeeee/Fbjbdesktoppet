@echo off
chcp 65001 >nul
cd /d "%~dp0"
for %%F in (菲比桌宠*.exe) do (
  start "" "%%~fF"
  exit /b 0
)
echo 未找到 菲比桌宠.exe，请确认已完整解压。
pause
