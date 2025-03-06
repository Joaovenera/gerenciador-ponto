// routes/index.js
const express = require('express');
const router = express.Router();

// Importar rotas da API v1
const authRoutes = require('./v1/auth');
const funcionariosRoutes = require('./v1/funcionarios');
const pontosRoutes = require('./v1/pontos');
const relatoriosRoutes = require('./v1/relatorios');
const utilsRoutes = require('./v1/utils');

// Configurar rotas da API v1
router.use('/v1/auth', authRoutes);
router.use('/v1/funcionarios', funcionariosRoutes);
router.use('/v1/pontos', pontosRoutes);
router.use('/v1/relatorios', relatoriosRoutes);
router.use('/v1/utils', utilsRoutes);

// Rota padrão para API v1
router.get('/v1', (req, res) => {
  res.json({
    message: 'API de Registro de Ponto - v1',
    endpoints: [
      '/v1/auth',
      '/v1/funcionarios',
      '/v1/pontos',
      '/v1/relatorios',
      '/v1/utils'
    ]
  });
});

// Rota raiz da API
router.get('/', (req, res) => {
  res.json({
    message: 'API de Registro de Ponto',
    versions: [
      '/v1'
    ]
  });
});

module.exports = router;
