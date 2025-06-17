@echo off
echo --------------------------------------
echo AirSense - Starting Development Setup
echo --------------------------------------

REM Check if .env files exist
if not exist .env.development (
    echo Creating .env.development file...
    echo VITE_API_URL=http://localhost:5000 > .env.development
    echo VITE_APP_NAME=Airsense >> .env.development
)

if not exist server\.env (
    echo Creating server/.env file...
    echo MONGODB_URI=mongodb://localhost:27017 > server\.env
    echo MONGODB_DB=environmental_data >> server\.env
    echo MONGODB_COLLECTION=datasets >> server\.env
    echo PORT=5000 >> server\.env
    echo NODE_ENV=development >> server\.env
    echo OPENWEATHER_API_KEY=your_api_key_here >> server\.env
    echo GEMINI_API_KEY=your_api_key_here >> server\.env
)

echo Starting API server...
start cmd /k "cd server && npm install && npm start"

REM Wait for server to start
timeout /t 5

echo Starting frontend development server...
start cmd /k "npm run dev"

echo.
echo --------------------------------------
echo Development servers started!
echo.
echo API server running at: http://localhost:5000
echo Frontend running at: http://localhost:5173
echo.
echo Press CTRL+C to stop the servers
echo --------------------------------------
