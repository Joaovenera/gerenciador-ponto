#!/bin/bash

# Este script testa a conexão com o banco de dados PostgreSQL

echo "Testando conexão com o banco de dados..."

# Se estiver executando no Docker
if [ -n "$(docker ps -q -f name=timetracker-app-dev)" ]; then
  echo "Testando conexão do ambiente de desenvolvimento..."
  docker exec timetracker-app-dev node -e "
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('sslmode=require') ? {
        rejectUnauthorized: false
      } : undefined
    });
    pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        process.exit(1);
      } else {
        console.log('Conexão bem-sucedida! Data e hora do servidor:', res.rows[0].now);
        process.exit(0);
      }
    });
  "
elif [ -n "$(docker ps -q -f name=timetracker-app)" ]; then
  echo "Testando conexão do ambiente de produção..."
  docker exec timetracker-app node -e "
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('sslmode=require') ? {
        rejectUnauthorized: false
      } : undefined
    });
    pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        process.exit(1);
      } else {
        console.log('Conexão bem-sucedida! Data e hora do servidor:', res.rows[0].now);
        process.exit(0);
      }
    });
  "
else
  # Se não estiver executando no Docker, teste local
  echo "Testando conexão local..."
  node -e "
    require('dotenv').config();
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('sslmode=require') ? {
        rejectUnauthorized: false
      } : undefined
    });
    pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        process.exit(1);
      } else {
        console.log('Conexão bem-sucedida! Data e hora do servidor:', res.rows[0].now);
        process.exit(0);
      }
    });
  "
fi

# Verifique o código de saída
if [ $? -eq 0 ]; then
  echo "Teste de conexão concluído com sucesso."
else
  echo "Falha no teste de conexão. Verifique os logs acima para detalhes."
  exit 1
fi