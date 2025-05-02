#!/bin/bash

# Configuração para exibição de registros coloridos
RED='\e[1;31m'
GREEN='\e[1;32m'
YELLOW='\e[1;33m'
BLUE='\e[1;34m'
MAGENTA='\e[1;35m'
CYAN='\e[1;36m'
NC='\e[0m' # No Color

# Função para registrar com timestamp
log() {
  echo -e "$(date +'%Y-%m-%d %H:%M:%S') - $1"
}

header() {
  echo -e "\n${BLUE}=========================================================${NC}"
  echo -e "${BLUE}= $1${NC}"
  echo -e "${BLUE}=========================================================${NC}\n"
}

success() {
  echo -e "\n${GREEN}✓ $1${NC}\n"
}

error() {
  echo -e "\n${RED}✗ $1${NC}\n"
}

info() {
  echo -e "${CYAN}ℹ $1${NC}"
}

check_db_connection() {
  local container_name=$1
  local environment=$2
  local connection_type=$3
  local test_script="
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require') ? {
        rejectUnauthorized: false
      } : undefined
    });

    async function testConnection() {
      try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as now, current_database() as database, version() as version');
        client.release();
        console.log(JSON.stringify(result.rows[0]));
        return true;
      } catch (err) {
        console.error(JSON.stringify({ error: err.message }));
        return false;
      } finally {
        pool.end();
      }
    }

    testConnection().then(success => process.exit(success ? 0 : 1));
  "

  if [ "$connection_type" = "local" ]; then
    info "Executando teste de conexão $environment localmente..."
    result=$(node -e "require('dotenv').config(); $test_script" 2>&1)
  else
    info "Executando teste de conexão $environment via container $container_name..."
    result=$(docker exec $container_name node -e "$test_script" 2>&1)
  fi

  if [ $? -eq 0 ]; then
    # Parse JSON result
    now=$(echo $result | grep -o '"now":"[^"]*"' | cut -d '"' -f 4)
    db=$(echo $result | grep -o '"database":"[^"]*"' | cut -d '"' -f 4)
    version=$(echo $result | grep -o '"version":"[^"]*"' | cut -d '"' -f 4)
    
    success "Conexão $environment bem-sucedida!"
    info "Banco de dados: ${MAGENTA}$db${NC}"
    info "Data e hora: ${MAGENTA}$now${NC}"
    info "Versão: ${MAGENTA}$(echo $version | cut -d ' ' -f 1-3)${NC}"
    return 0
  else
    error_msg=$(echo $result | grep -o '"error":"[^"]*"' | cut -d '"' -f 4)
    error "Falha na conexão $environment: $error_msg"
    return 1
  fi
}

header "TESTE DE CONEXÃO COM O BANCO DE DADOS POSTGRESQL"

# Detecta o ambiente e executa o teste apropriado
if [ -n "$(docker ps -q -f name=timetracker-app-dev)" ]; then
  log "${YELLOW}Ambiente de desenvolvimento detectado${NC}"
  check_db_connection "timetracker-app-dev" "de desenvolvimento" "container"
  dev_status=$?
elif [ -n "$(docker ps -q -f name=timetracker-app)" ]; then
  log "${YELLOW}Ambiente de produção detectado${NC}"
  check_db_connection "timetracker-app" "de produção" "container"
  prod_status=$?
else
  log "${YELLOW}Nenhum container Docker detectado, testando conexão local${NC}"
  # Verifica se .env existe
  if [ ! -f .env ] && [ ! -f ../.env ]; then
    error "Arquivo .env não encontrado. Crie um arquivo .env com a variável DATABASE_URL para testar localmente."
    exit 1
  fi
  check_db_connection "local" "local" "local"
  local_status=$?
fi

header "RESUMO DO TESTE DE CONEXÃO"

if [ -n "$dev_status" ] && [ $dev_status -eq 0 ]; then
  success "Ambiente de desenvolvimento: Conexão estabelecida com sucesso"
elif [ -n "$dev_status" ]; then
  error "Ambiente de desenvolvimento: Falha na conexão"
fi

if [ -n "$prod_status" ] && [ $prod_status -eq 0 ]; then
  success "Ambiente de produção: Conexão estabelecida com sucesso"
elif [ -n "$prod_status" ]; then
  error "Ambiente de produção: Falha na conexão"
fi

if [ -n "$local_status" ] && [ $local_status -eq 0 ]; then
  success "Ambiente local: Conexão estabelecida com sucesso"
elif [ -n "$local_status" ]; then
  error "Ambiente local: Falha na conexão"
fi

if { [ -n "$dev_status" ] && [ $dev_status -eq 0 ]; } || { [ -n "$prod_status" ] && [ $prod_status -eq 0 ]; } || { [ -n "$local_status" ] && [ $local_status -eq 0 ]; }; then
  header "RESULTADO FINAL: ${GREEN}SUCESSO${NC}"
  exit 0
else
  header "RESULTADO FINAL: ${RED}FALHA${NC}"
  exit 1
fi