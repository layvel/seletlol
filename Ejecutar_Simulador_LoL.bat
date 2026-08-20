@echo off
title Lanzador LoL Simulador
echo Iniciando Simulador de LoL...
if exist "dist\LoL_Simulador.exe" (
    start "" "dist\LoL_Simulador.exe"
) else (
    python app_launcher.py
)
exit
