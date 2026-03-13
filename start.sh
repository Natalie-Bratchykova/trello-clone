#!/bin/bash

# Load nvm
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"

echo "Starting docker containers..."
docker-compose up -d

echo "Starting backend..."
(
  cd backend || exit
  nvm use 20
  npm run start:dev
) &

echo "Starting frontend..."
(
  cd frontend || exit
  nvm use 20
  npm run dev
) &

echo "All services started."

wait