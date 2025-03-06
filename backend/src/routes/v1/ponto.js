// routes/v1/pontos.js
const express = require('express');
const router = express.Router();
const pontoController = require('../../controllers/pontoController');
const { authMiddleware, adminMiddleware } = require('../../middlewares/auth');
const { validatePonto } = require('../../middlewares/validation');

// Rota para registrar ponto (funcionários podem registrar)
router.post('/', authMiddleware, validatePonto, pontoController.registrarPonto);

// Rota para listar todos os pontos (admin)
router.get('/', authMiddleware, adminMiddleware, pontoController.getAllPontos);

// Rota para listar pontos de um funcionário específico
router.get('/funcionario/:id', authMiddleware, pontoController.getPontosByFuncionario);

// Rota para obter detalhes de um registro específico
router.get('/:id', authMiddleware, pontoController.getPontoById);

// Rotas para corrigir ou excluir registros (somente admin)
router.put('/:id', authMiddleware, adminMiddleware, validatePonto, pontoController.updatePonto);
router.delete('/:id', authMiddleware, adminMiddleware, pontoController.deletePonto);

module.exports = router;