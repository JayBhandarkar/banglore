@echo off
title Gridlock.AI Launcher
echo ===================================================
echo   Gridlock.AI Traffic Remediation ^& Prediction API
echo   Launcher Script (Windows)
echo ===================================================
echo.

echo [1/3] Checking python environment...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python was not found in your PATH. Please install Python 3.8+ first.
    pause
    exit /b
)

echo [2/3] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not found in your PATH. Please install Node.js 16+ first.
    pause
    exit /b
)

echo [3/3] Launching servers in separate console windows...

:: Launch Backend
echo Launching FastAPI Backend on http://localhost:8000...
start "Gridlock Backend (FastAPI)" cmd /c "cd backend && python -m pip install -r requirements.txt && python -m uvicorn main:app --reload --port 8000"

:: Launch Frontend
echo Launching Next.js Frontend on http://localhost:3000...
start "Gridlock Frontend (Next.js)" cmd /c "cd frontend && npm run dev"

echo.
echo ===================================================
echo   [SUCCESS] Servers initiated!
echo   - Backend Router API: http://localhost:8000
echo   - Frontend Command Centre: http://localhost:3000
echo.
echo   Press any key to close this launcher console.
echo   (Keep the launched console windows open!)
echo ===================================================
pause
