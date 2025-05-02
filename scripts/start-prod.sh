#!/bin/sh

# This script starts the production environment

echo "Starting production environment..."
docker-compose up -d

# Espera o banco de dados ficar pronto
echo "Aguardando o banco de dados ficar pronto..."
until nc -z db 5432; do
  sleep 2
done
echo "Banco de dados está pronto!"

# Run migrations
echo "Running database migrations..."
npm run db:push

npm run build
npm run start

echo "Production environment is up and running!"
echo "Access the application at http://localhost:5000"
