FROM node:20-alpine AS builder

# Instala dependências necessárias
RUN apk add --no-cache netcat-openbsd

# Cria o diretório da aplicação
WORKDIR /app

# Copia apenas os arquivos de configuração de pacotes
COPY package*.json ./

# Instala todas as dependências (incluindo dev para build)
RUN npm ci

# Copia o restante da aplicação
COPY . .

# Constrói a aplicação
RUN npm run build

# Segunda fase: imagem de produção
FROM node:20-alpine

# Instala dependências necessárias para produção
RUN apk add --no-cache netcat-openbsd

# Define variáveis de ambiente para produção
ENV NODE_ENV=production

# Cria o diretório da aplicação
WORKDIR /app

# Copia apenas os arquivos de configuração de pacotes
COPY package*.json ./

# Instala apenas dependências de produção
RUN npm ci --only=production

# Copia artefatos de build e scripts necessários
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/scripts /app/scripts

# Dá permissão para executar os scripts
RUN chmod +x /app/scripts/*.sh

# Expõe a porta
EXPOSE 5000

# Define um usuário não-root para segurança
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

# Comando de start
CMD ["sh", "/app/scripts/start-prod.sh"]