# TimeTracker - Configuração Docker

Este documento contém as instruções para executar o sistema TimeTracker em ambientes de desenvolvimento e produção usando Docker.

## Pré-requisitos

- Docker instalado (v20.10+)
- Docker Compose instalado (v2.0+)
- Git instalado

## Estrutura de Docker

O projeto utiliza uma estrutura de Docker bem organizada:

- `Dockerfile`: Imagem multi-stage para produção
- `Dockerfile.dev`: Imagem para desenvolvimento
- `docker-compose.yml`: Configuração para ambiente de produção
- `docker-compose.dev.yml`: Configuração para ambiente de desenvolvimento
- Scripts auxiliares em `/scripts`

## Configuração de Ambiente

1. Clone o repositório:
   ```bash
   git clone [URL_DO_REPOSITORIO]
   cd timetracker
   ```

2. Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Configure as variáveis de ambiente no arquivo `.env` conforme necessário, especialmente:
   - `SESSION_SECRET`: Uma chave secreta forte para criptografia das sessões
   - `DB_PASSWORD`: Senha do banco de dados em produção
   - `PGADMIN_PASSWORD`: Senha do PGAdmin em produção

## Ambiente de Desenvolvimento

Para iniciar o ambiente de desenvolvimento:

```bash
./scripts/start-dev.sh
```

Isto iniciará:
- Aplicação Node.js no modo de desenvolvimento
- Banco de dados PostgreSQL
- PGAdmin (interface web para gerenciamento do banco)

A aplicação estará disponível em: http://localhost:5000  
O PGAdmin estará disponível em: http://localhost:5051

## Ambiente de Produção

Para implantar em produção:

1. Construía a imagem Docker (opcional, pode usar a imagem pré-construída):
   ```bash
   docker build -t nome-da-sua-org/gerenciador-ponto:latest .
   ```

2. Inicie a pilha de produção:
   ```bash
   docker-compose up -d
   ```

A aplicação estará disponível em: http://localhost:5000  
O PGAdmin estará disponível em: http://localhost:5050

## Comandos Úteis

### Verificar Status dos Containers
```bash
docker-compose ps
```

### Ver Logs
```bash
# Logs da aplicação
docker-compose logs -f app

# Logs do banco de dados
docker-compose logs -f db
```

### Testar Conexão com o Banco de Dados
```bash
./scripts/test-db-connection.sh
```

### Parar todos os Containers
```bash
./scripts/stop.sh
```

## Health Checks e Monitoramento

Os containers foram configurados com health checks para garantir disponibilidade.

Para verificar o status de saúde dos containers:
```bash
docker-compose ps
```

O endpoint de health check da API está disponível em:
```
GET /api/health
```

## Backup do Banco de Dados

Para fazer backup do banco de dados:

```bash
docker exec timetracker-db pg_dump -U root timetracker > backup_$(date +%Y%m%d).sql
```

## Restauração do Banco de Dados

Para restaurar um backup:

```bash
cat backup_YYYYMMDD.sql | docker exec -i timetracker-db psql -U root timetracker
```

## Segurança

Melhorias de segurança implementadas:

- Containers executam com usuário não-root
- Isolação de rede entre serviços
- Uso de variáveis de ambiente para credenciais
- Health checks para monitoramento
- Logs limitados para evitar crescimento descontrolado

## Troubleshooting

### Container não inicia

Verifique os logs:
```bash
docker-compose logs app
```

### Problemas de conexão com o banco de dados

Execute o script de teste de conexão:
```bash
./scripts/test-db-connection.sh
```

### Espaço em disco

Limpe volumes e imagens não utilizados:
```bash
docker system prune -a --volumes
```

## Notas Adicionais

- As imagens Docker são otimizadas com multi-stage builds para reduzir o tamanho
- Em produção, considere configurar um proxy reverso como Nginx ou Traefik na frente da aplicação
- Configure backups automáticos do banco de dados em produção
