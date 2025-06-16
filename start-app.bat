@echo off
echo --------------------------------------
echo MongoDB Dataset Analyzer - Starting App
echo --------------------------------------

echo Setting up environment...

REM Check if .env file exists, if not copy from template
if not exist server\.env (
    if exist server\.env.template (
        copy server\.env.template server\.env
        echo Created .env file from template
    ) else (
        echo WARNING: No .env template found. You may need to create an .env file manually.
    )
)

REM Create necessary directories
if not exist server\data mkdir server\data

REM Create file storage flag if it doesn't exist
if not exist server\data\using-file-storage.flag (
    echo true > server\data\using-file-storage.flag
    echo Created file storage flag
)

echo.
echo Starting server in background...
start "MongoDB Dataset Analyzer - Server" cmd /c "cd server && npm install && npm run dev"

echo.
echo Waiting for server to start...
timeout /t 5 /nobreak > nul

echo.
echo Starting client...
npm install
npm run dev

echo.
echo Application closed.
