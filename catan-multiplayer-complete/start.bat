@echo off
echo Starting Settlers of Catan Digital Board Game...
echo.

echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo Failed to install server dependencies
    pause
    exit /b 1
)

cd client
call npm install
if errorlevel 1 (
    echo Failed to install client dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo Starting the game...
echo Server will run on http://localhost:3001
echo Client will run on http://localhost:3000
echo.
echo Open your browser to http://localhost:3000 to play!
echo Press Ctrl+C to stop the servers.
echo.

call npm run dev