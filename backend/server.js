// server.js
require('dotenv').config();
const { app, initApp } = require('./src/app');

// Definir porta
const PORT = process.env.PORT || 3000;

// Inicializar aplicação e iniciar servidor
initApp().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`API disponível em http://localhost:${PORT}/api`);
  });
}).catch(error => {
  console.error('Erro ao iniciar aplicação:', error);
  process.exit(1);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('Erro não capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promessa rejeitada não tratada:', reason);
  process.exit(1);
});
