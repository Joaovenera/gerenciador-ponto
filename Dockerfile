FROM node:20-alpine

# Cria o diretório da aplicação
WORKDIR /app

# Copia apenas os pacotes primeiro
COPY package*.json ./

# Instala dependências de produção
RUN npm install

RUN npm install -dev

# Copia o restante da aplicação
COPY . .

# Dá permissão para executar o script
RUN chmod +x /app/scripts/start.sh

# Expõe a porta
EXPOSE 5000

# Comando de start
CMD ["sh", "/app/scripts/start-prod.sh"]