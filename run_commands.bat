@echo off
cd /d d:\Lab4

echo ============================================
echo Step 1: Running npm install
echo ============================================
call npm install
if %ERRORLEVEL% neq 0 (
    echo npm install FAILED with error code %ERRORLEVEL%
    exit /b 1
)
echo npm install completed successfully

echo.
echo ============================================
echo Step 2: Running npm run dev
echo ============================================
call npm run dev
