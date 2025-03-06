// routes/v1/pontos.js
const express = require('express');
const router = express.Router();
const pontoController = require('../../controllers/pontoController');
const { authMiddleware } = require('../../middlewares/auth');
const adminMiddleware = require('../../middlewares/admin');
const { validatePonto } = require('../../middlewares/validation');

/**
 * @route POST /pontos
 * @desc Registra um check-in ou check-out
 * @access Autenticado
 */
router.post('/', authMiddleware, validatePonto, pontoController.registrarPonto);

/**
 * @route GET /pontos
 * @desc Lista todos os registros de ponto
 * @access Admin
 */
router.get('/', authMiddleware, adminMiddleware, pontoController.getAllPontos);

/**
 * @route GET /pontos/funcionario/:id
 * @desc Obtém registros de um funcionário específico
 * @access Autenticado (admin ou próprio funcionário)
 */
router.get('/funcionario/:id', authMiddleware, pontoController.getPontosByFuncionario);

/**
 * @route GET /pontos/:id
 * @desc Obtém detalhes de um registro específico
 * @access Autenticado (admin ou próprio funcionário)
 */
router.get('/:id', authMiddleware, pontoController.getPontoById);

/**
 * @route PUT /pontos/:id
 * @desc Corrige um registro (somente admin)
 * @access Admin
 */
router.put('/:id', authMiddleware, adminMiddleware, validatePonto, pontoController.updatePonto);

/**
 * @route DELETE /pontos/:id
 * @desc Remove um registro de ponto (somente admin)
 * @access Admin
 */
router.delete('/:id', authMiddleware, adminMiddleware, pontoController.deletePonto);

module.exports = router;
