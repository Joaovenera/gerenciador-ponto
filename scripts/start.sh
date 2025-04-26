#!/bin/sh

# Espera o banco de dados ficar pronto
echo "Aguardando o banco de dados ficar pronto..."
until nc -z db 5432; do
  sleep 2
done
echo "Banco de dados está pronto!"

# Instala dependências de dev
npm install --include=dev

# Roda migrações
npm run db:push

# Inicia a aplicação
npm run dev
