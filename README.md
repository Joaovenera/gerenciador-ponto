# Aplicação de Registro de Ponto

Este é um sistema web de registro de ponto de funcionários com geolocalização, captura de fotos e funcionalidades administrativas completas.

## Configuração Docker

A aplicação foi otimizada para usar Docker em ambientes de desenvolvimento e produção com PostgreSQL 17 self-hosted.

### Pré-requisitos

- Docker
- Docker Compose

### Configuração Inicial

Antes de iniciar o ambiente, você deve configurar o arquivo `.env` na raiz do projeto:

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env` conforme necessário para seu ambiente (veja a seção "Variáveis de Ambiente").

### Ambiente de Desenvolvimento

Para iniciar o ambiente de desenvolvimento com hot reloading:

```bash
./scripts/start-dev.sh
```

Isso vai:
1. Iniciar o PostgreSQL 17 no Docker
2. Iniciar a aplicação em modo de desenvolvimento
3. Executar as migrações de banco de dados necessárias

A aplicação estará acessível em http://localhost:5000

### Ambiente de Produção

Para iniciar o ambiente de produção:

```bash
./scripts/start-prod.sh
```

Isso vai:
1. Construir a aplicação
2. Iniciar o PostgreSQL 17 no Docker
3. Iniciar a aplicação em modo de produção
4. Executar as migrações de banco de dados necessárias

A aplicação estará acessível em http://localhost:5000

### Migrações do Banco de Dados

Para executar migrações de banco de dados manualmente:

```bash
./scripts/db-migrate.sh
```

### Parando o Ambiente

Para parar todos os ambientes em execução:

```bash
./scripts/stop.sh
```

## Estrutura de Diretórios

- `/client` - Código frontend
- `/server` - Código backend
- `/shared` - Código compartilhado (schemas, tipos)
- `/scripts` - Scripts auxiliares para o ambiente Docker

## Variáveis de Ambiente

O projeto usa um arquivo `.env` para configuração do banco de dados PostgreSQL. Um modelo está disponível no arquivo `.env.example`. As principais variáveis são:

```
# Para ambiente Docker
DATABASE_URL=postgresql://postgres:postgres@db:5432/timetracker?sslmode=disable
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=timetracker
PGHOST=db
PGPORT=5432

# Para ambiente local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/timetracker?sslmode=disable
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=timetracker
PGHOST=localhost
PGPORT=5432
```

Estas variáveis são carregadas automaticamente pelo Docker Compose e pela aplicação. Você pode personalizar os valores conforme necessário para seu ambiente.

## Fluxo de Desenvolvimento

1. Faça alterações no código
2. As alterações serão automaticamente refletidas no ambiente de desenvolvimento devido ao hot reloading
3. Teste suas alterações
4. Confirme suas alterações
5. Implante para produção

## Implantação de Produção

Para implantar em produção, execute:

```bash
./scripts/start-prod.sh
```

Isso construirá uma imagem pronta para produção e iniciará a aplicação em modo de produção.
