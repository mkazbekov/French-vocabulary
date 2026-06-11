@echo off
title Mon Francais - French Vocabulary Trainer
echo.
echo  ===========================================
echo   Mon Francais - French Vocabulary Trainer
echo  ===========================================
echo.
echo  Starting the app at http://localhost:8123
echo  Keep this window open while you study.
echo  Close it (or press Ctrl+C) when you finish.
echo.
start "" http://localhost:8123
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port 8123
if errorlevel 1 (
  echo.
  echo  The app may already be running in another window -
  echo  check your browser at http://localhost:8123
  echo.
  pause
)
