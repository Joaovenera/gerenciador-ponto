FROM node:20-alpine
<<<<<<< HEAD
#
=======

>>>>>>> 635c7ef (commit)
# Cria o diretório da aplicação
WORKDIR /app

# Copia apenas os pacotes primeiro
COPY package*.json ./

# Instala dependências de produção
RUN npm install

<<<<<<< HEAD
# Copia o restante da aplicação
COPY . .

# Copia o script de start
COPY scripts/start.sh /app/start.sh

# Dá permissão para executar o script
RUN chmod +x /app/start.sh

=======
RUN npm install -dev

# Copia o restante da aplicação
COPY . .

# Dá permissão para executar o script
RUN chmod +x /app/scripts/start.sh

>>>>>>> 635c7ef (commit)
# Expõe a porta
EXPOSE 5000

# Comando de start
<<<<<<< HEAD
CMD ["./start.sh"]
=======
CMD ["sh", "/app/scripts/start-prod.sh"]

>>>>>>> 635c7ef (commit)
