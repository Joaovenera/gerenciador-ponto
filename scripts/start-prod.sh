#!/bin/bash

# This script starts the production environment

echo "Starting production environment..."
docker-compose up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Run migrations
echo "Running database migrations..."
docker exec timetracker-app npm run db:push

echo "Production environment is up and running!"
echo "Access the application at http://localhost:5000"