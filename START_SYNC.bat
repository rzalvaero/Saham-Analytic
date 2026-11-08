@echo off
title ReezTrade Live Sync Agent to trade.reez.my.id
color 0A
echo ========================================================
echo  REEZTRADE LIVE SYNC AGENT to https://trade.reez.my.id/
echo ========================================================
echo.
python "%~dp0sync_agent.py"
pause

