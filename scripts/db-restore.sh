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

# Verifica se foi fornecido um arquivo para restauração
if [ -z "$1" ]; then
  echo -e "${RED}Erro: Arquivo de backup não especificado.${NC}"
  echo -e "${YELLOW}Uso: $0 <arquivo_backup>${NC}"
  echo -e "${YELLOW}Backups disponíveis:${NC}"
  ls -1t ${BACKUP_DIR}/${DB_NAME}_backup_*.sql* 2>/dev/null || echo "  Nenhum backup encontrado em ${BACKUP_DIR}"
  exit 1
fi

# Verifica se o arquivo existe
BACKUP_FILE="$1"
if [[ ! -f "${BACKUP_FILE}" && ! -f "${BACKUP_DIR}/${BACKUP_FILE}" ]]; then
  # Tenta encontrar nos arquivos de backup
  if [[ -f "${BACKUP_DIR}/${DB_NAME}_backup_${BACKUP_FILE}.sql" ]]; then
    BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${BACKUP_FILE}.sql"
  elif [[ -f "${BACKUP_DIR}/${DB_NAME}_backup_${BACKUP_FILE}.sql.gz" ]]; then
    BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${BACKUP_FILE}.sql.gz"
  else
    echo -e "${RED}Erro: Arquivo de backup não encontrado: ${BACKUP_FILE}${NC}"
    exit 1
  fi
fi

echo -e "${BLUE}Iniciando restauração do banco de dados ${DB_NAME} a partir de ${BACKUP_FILE}...${NC}"

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

# Solicita confirmação do usuário
echo -e "${RED}ATENÇÃO: Esta operação substituirá todos os dados atuais do banco ${DB_NAME}.${NC}"
read -p "Deseja continuar? (s/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Ss]$ ]]; then
  echo -e "${YELLOW}Operação cancelada pelo usuário.${NC}"
  exit 0
fi

# Faz um backup antes da restauração por segurança
echo -e "${YELLOW}Criando backup de segurança antes da restauração...${NC}"
BACKUP_DATETIME=$(date +%Y%m%d_%H%M%S)
SAFETY_BACKUP="${BACKUP_DIR}/${DB_NAME}_pre_restore_${BACKUP_DATETIME}.sql.gz"

if ! docker exec -t ${CONTAINER} pg_dump -U ${DB_USER} -d ${DB_NAME} | gzip > ${SAFETY_BACKUP}; then
  echo -e "${RED}Erro ao criar backup de segurança. Deseja continuar mesmo assim? (s/N): ${NC}"
  read -p "" CONTINUE
  if [[ ! "$CONTINUE" =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Operação cancelada pelo usuário.${NC}"
    exit 0
  fi
else
  echo -e "${GREEN}Backup de segurança criado: ${SAFETY_BACKUP}${NC}"
fi

# Executa a restauração
echo -e "${BLUE}Restaurando banco de dados...${NC}"

# Verifica se o arquivo está comprimido
if [[ "${BACKUP_FILE}" == *.gz ]]; then
  if gunzip -c "${BACKUP_FILE}" | docker exec -i ${CONTAINER} psql -U ${DB_USER} -d ${DB_NAME}; then
    echo -e "${GREEN}Restauração concluída com sucesso!${NC}"
  else
    echo -e "${RED}Erro ao restaurar o banco de dados.${NC}"
    echo -e "${YELLOW}Um backup de segurança foi criado em: ${SAFETY_BACKUP}${NC}"
    exit 1
  fi
else
  if cat "${BACKUP_FILE}" | docker exec -i ${CONTAINER} psql -U ${DB_USER} -d ${DB_NAME}; then
    echo -e "${GREEN}Restauração concluída com sucesso!${NC}"
  else
    echo -e "${RED}Erro ao restaurar o banco de dados.${NC}"
    echo -e "${YELLOW}Um backup de segurança foi criado em: ${SAFETY_BACKUP}${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}Processo de restauração concluído.${NC}"
echo -e "${YELLOW}Recomenda-se reiniciar os serviços da aplicação para garantir conexões corretas ao banco restaurado.${NC}"
