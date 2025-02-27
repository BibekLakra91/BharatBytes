#!/bin/bash
set -e

echo "=== GoldByte Project: Starting Build & Deployment ==="

# Step 1: Compile Contracts
echo "Compiling smart contracts..."
npx hardhat compile

# Step 2: Run Tests
echo "Running tests..."
npx hardhat test

# Step 3: Deploy Contract on Mumbai
echo "Deploying GoldByte contract on Mumbai..."
npx hardhat run scripts/deploy.js --network mumbai

echo "NOTE: Update server/.env with the deployed contract address if necessary."

# Step 4: Start the API Server
echo "Starting API server..."
cd server
npm install
npm start &
cd ..

# Step 5: Open the Client Dashboard in the default browser
if command -v xdg-open &> /dev/null
then
    xdg-open "http://localhost/client/index.html"
elif command -v open &> /dev/null
then
    open "http://localhost/client/index.html"
else
    echo "Please open http://localhost/client/index.html in your browser."
fi

echo "GoldByte project is now running!"
