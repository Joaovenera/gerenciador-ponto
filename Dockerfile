FROM node:20-alpine
#
# Cria o diretório da aplicação
WORKDIR /app

# Copia apenas os pacotes primeiro
COPY package*.json ./

# Instala dependências de produção
RUN npm install

# Copia o restante da aplicação
COPY . .

# Copia o script de start
COPY scripts/start.sh /app/start.sh

# Dá permissão para executar o script
RUN chmod +x /app/start.sh

# Expõe a porta
EXPOSE 5000

# Comando de start
CMD ["./start.sh"]
