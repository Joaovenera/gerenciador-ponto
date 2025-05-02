#!/bin/bash

# Configuração para exibição de registros coloridos
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Carrega variáveis de ambiente se existir arquivo .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Define as variáveis de banco de dados
DB_USER=${DB_USER:-root}
DB_NAME=${DB_NAME:-timetracker}
BACKUP_DIR="./backups"
DATETIME=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${DATETIME}.sql"

# Cria o diretório de backup se não existir
mkdir -p ${BACKUP_DIR}

echo -e "${BLUE}Iniciando backup do banco de dados ${DB_NAME}...${NC}"

# Verifica se o ambiente é de produção ou desenvolvimento
if [ -n "$(docker ps -q -f name=timetracker-app)" ]; then
  CONTAINER="timetracker-db"
  echo -e "${YELLOW}Ambiente de produção detectado. Usando container ${CONTAINER}${NC}"
elif [ -n "$(docker ps -q -f name=timetracker-app-dev)" ]; then
  CONTAINER="timetracker-db-dev"
  echo -e "${YELLOW}Ambiente de desenvolvimento detectado. Usando container ${CONTAINER}${NC}"
else
  echo -e "${RED}Nenhum ambiente Docker detectado. Certifique-se que os containers estão em execução.${NC}"
  exit 1
fi

# Executa o backup
if docker exec -t ${CONTAINER} pg_dump -U ${DB_USER} -d ${DB_NAME} > ${BACKUP_FILE}; then
  # Comprime o arquivo de backup
  gzip ${BACKUP_FILE}
  echo -e "${GREEN}Backup realizado com sucesso: ${BACKUP_FILE}.gz${NC}"
  echo -e "${BLUE}Tamanho do arquivo:${NC} $(du -h ${BACKUP_FILE}.gz | cut -f1)"
  echo -e "${BLUE}Data e hora:${NC} $(date)"
else
  echo -e "${RED}Erro ao realizar o backup do banco de dados.${NC}"
  exit 1
fi

# Limpa backups antigos (mantém apenas os 7 mais recentes)
echo -e "${YELLOW}Limpando backups antigos...${NC}"
ls -t ${BACKUP_DIR}/${DB_NAME}_backup_*.sql.gz | tail -n +8 | xargs -r rm

echo -e "${GREEN}Processo de backup concluído.${NC}"
