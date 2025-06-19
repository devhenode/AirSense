@echo off
echo ===== AirSense Cloud Deployment =====

echo.
echo Building frontend with production settings...
call npm run build

echo.
echo Deploying backend service...
cd server
call gcloud app deploy --quiet
cd ..

echo.
echo Deploying frontend service...
call gcloud app deploy --quiet

echo.
echo Deploying dispatch rules...
call gcloud app deploy dispatch.yaml --quiet

echo.
echo ===== Deployment Complete =====
echo Backend URL: https://mongodb-analyzer.ew.r.appspot.com
echo Frontend URL: https://frontend-dot-mongodb-analyzer.ew.r.appspot.com
echo.
echo Please allow a few minutes for services to start.

pause
