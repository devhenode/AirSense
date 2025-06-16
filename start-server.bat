@echo off
echo --------------------------------------
echo MongoDB Dataset Analyzer - Server Setup
echo --------------------------------------

echo Installing dependencies...
cd server
npm install

echo.
echo Creating .env file if it doesn't exist...
if not exist .env copy .env.template .env

echo.
echo Creating data directory...
if not exist data mkdir data

echo.
echo Setting up file storage...
echo true > data\using-file-storage.flag

echo.
echo Building and seeding the database...
npm run seed

echo.
echo Starting the server...
npm run dev

echo.
echo Server is now running!
echo Press Ctrl+C to stop the server.
