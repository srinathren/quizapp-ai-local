@echo off
echo Starting AI Quiz Generator...
echo.

REM Check if MongoDB is running
echo Checking MongoDB connection...
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo MongoDB is not installed or not in PATH.
    echo Please install MongoDB and try again.
    pause
    exit /b 1
)

REM Check if Node.js is installed
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed or not in PATH.
    echo Please install Node.js and try again.
    pause
    exit /b 1
)

REM Start the Llama server in a new window
echo Starting Llama server...
start "Llama Server" cmd /c "npm run llm"

REM Wait for Llama server to start
echo Waiting for Llama server to initialize...
timeout /t 10 /nobreak

REM Start the backend server in a new window
echo Starting backend server...
start "Backend Server" cmd /c "npm run server"

REM Wait for backend server to start
echo Waiting for backend server to initialize...
timeout /t 5 /nobreak

REM Start the frontend in a new window
echo Starting frontend...
start "Frontend" cmd /c "npm run client"

echo.
echo AI Quiz Generator is starting up!
echo.
echo - Llama server: http://127.0.0.1:8080
echo - Backend API: http://localhost:5000
echo - Frontend: http://localhost:3000
echo.
echo You can close this window after you're done using the application.
echo To stop all services, close their respective command windows.
pause 