#!/bin/bash

# This script runs database migrations using drizzle-kit

# Ensure the container is running
if ! docker ps | grep -q timetracker-app; then
  echo "Error: The application container is not running. Please start it with docker-compose up -d"
  exit 1
fi

# Run migrations
echo "Running database migrations..."
docker exec timetracker-app npm run db:push

echo "Migrations completed."