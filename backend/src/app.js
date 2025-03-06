// app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./utils/errorHandler');
const { initDatabase } = require('./config/database');

// Criar aplicação Express
const app = express();

// Configurar middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Configurar rotas
app.use('/api', routes);

// Middleware para rotas não encontradas
app.use(notFoundHandler);

// Middleware para tratamento de erros
app.use(errorHandler);

// Inicializar banco de dados
const initApp = async () => {
  try {
    await initDatabase();
    console.log('Banco de dados inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    process.exit(1);
  }
};

module.exports = { app, initApp };
