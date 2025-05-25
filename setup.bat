@echo off
echo AI Quiz App with llama-cpp Setup
echo ==============================
echo.

REM Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed! Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b
)

REM Check for npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo npm is not installed! Please reinstall Node.js with npm.
    pause
    exit /b
)

echo Installing npm dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install npm dependencies!
    pause
    exit /b
)

REM Check for MongoDB
echo Checking for MongoDB...
where mongod >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: MongoDB may not be installed or not in PATH.
    echo Please install MongoDB from: https://www.mongodb.com/try/download/community
    echo.
    set /p continue="Continue anyway? (y/n): "
    if /i "%continue%" NEQ "y" exit /b
) else (
    echo MongoDB is installed.
)

REM Check for Python
echo Checking for Python...
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Python is not found. llama-cpp-python requires Python.
    echo Please install Python from: https://www.python.org/downloads/
    echo.
    set /p continue="Continue anyway? (y/n): "
    if /i "%continue%" NEQ "y" exit /b
) else (
    echo Python is installed.
)

REM Check for llama-cpp-python
echo Checking for llama-cpp-python...
python -c "import llama_cpp" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo llama-cpp-python is not installed.
    set /p install_llama="Do you want to install llama-cpp-python now? (y/n): "
    if /i "%install_llama%" EQU "y" (
        echo Installing llama-cpp-python[server]...
        pip install llama-cpp-python[server]
        if %ERRORLEVEL% NEQ 0 (
            echo Failed to install llama-cpp-python. Please install it manually.
            pause
        ) else (
            echo Successfully installed llama-cpp-python[server].
        )
    )
) else (
    echo llama-cpp-python is installed.
)

REM Setup model
echo Setting up model...
call npm run setup-model

echo.
echo Setup completed!
echo.
echo To start the application:
echo 1. First start the llama-cpp server: npm run llm
echo 2. In a new terminal, start the application: npm run dev
echo.
echo Make sure MongoDB is running before starting the application.
echo.
pause 