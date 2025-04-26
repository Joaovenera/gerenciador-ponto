#!/bin/bash

# This script starts the development environment

echo "Starting development environment..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Run migrations
echo "Running database migrations..."
docker exec timetracker-app-dev npm run db:push

echo "Development environment is up and running!"
echo "Access the application at http://localhost:5000"