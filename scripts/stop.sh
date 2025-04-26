#!/bin/bash

# This script stops all running environments

# Check if any environment is running
if docker ps | grep -q "timetracker-app\|timetracker-app-dev"; then
  echo "Stopping all environments..."
  
  # Stop production environment if running
  if docker ps | grep -q "timetracker-app"; then
    echo "Stopping production environment..."
    docker-compose down
  fi
  
  # Stop development environment if running
  if docker ps | grep -q "timetracker-app-dev"; then
    echo "Stopping development environment..."
    docker-compose -f docker-compose.dev.yml down
  fi
  
  echo "All environments have been stopped."
else
  echo "No running environments found."
fi