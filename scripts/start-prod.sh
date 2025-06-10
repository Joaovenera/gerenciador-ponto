#!/bin/sh

# Configuração para capturar sinais e encerrar adequadamente
trap 'echo "Recebeu sinal de interrupção. Encerrando..."; exit 0' INT TERM

# Configuração para exibição de registros coloridos
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Função para registrar com timestamp
log() {
  echo "$(date +'%Y-%m-%d %H:%M:%S') - $1"
}

# Verifica se o banco de dados está acessível
log "${YELLOW}Verificando conexão com o banco de dados...${NC}"

DB_HOST="db"
DB_PORT="5432"
MAX_RETRIES=30
RETRY_INTERVAL=2

COUNTER=0
while ! nc -z "$DB_HOST" "$DB_PORT"; do
  if [ $COUNTER -eq $MAX_RETRIES ]; then
    log "${RED}Erro: Não foi possível conectar ao banco de dados após $MAX_RETRIES tentativas.${NC}"
    exit 1
  fi
  
  COUNTER=$((COUNTER+1))
  log "${YELLOW}Aguardando conexão com o banco de dados... ($COUNTER/$MAX_RETRIES)${NC}"
  sleep $RETRY_INTERVAL
done

log "${GREEN}Conexão com o banco de dados estabelecida com sucesso!${NC}"

# Executa migrações do banco de dados
log "${YELLOW}Executando migrações do banco de dados...${NC}"
if npm run db:push; then
  log "${GREEN}Migrações executadas com sucesso!${NC}"
else
  log "${RED}Erro ao executar migrações do banco de dados.${NC}"
  exit 1
fi

# Inicia o servidor em modo de produção
log "${GREEN}Iniciando aplicação em modo de produção...${NC}"
exec npm run start
