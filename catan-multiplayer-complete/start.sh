#!/bin/bash

echo "Starting Settlers of Catan Digital Board Game..."
echo

echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install server dependencies"
    exit 1
fi

cd client
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install client dependencies"
    exit 1
fi
cd ..

echo
echo "Starting the game..."
echo "Server will run on http://localhost:3001"
echo "Client will run on http://localhost:3000"
echo
echo "Open your browser to http://localhost:3000 to play!"
echo "Press Ctrl+C to stop the servers."
echo

npm run dev