// routes/v1/funcionarios.js
const express = require('express');
const router = express.Router();
const funcionarioController = require('../../controllers/funcionarioController');
const { authMiddleware } = require('../../middlewares/auth');
const adminMiddleware = require('../../middlewares/admin');
const { validateFuncionario } = require('../../middlewares/validation');

/**
 * @route POST /funcionarios
 * @desc Cria um novo funcionário
 * @access Admin
 */
router.post('/', authMiddleware, adminMiddleware, validateFuncionario, funcionarioController.createFuncionario);

/**
 * @route GET /funcionarios
 * @desc Lista todos os funcionários
 * @access Autenticado
 */
router.get('/', authMiddleware, funcionarioController.getAllFuncionarios);

/**
 * @route GET /funcionarios/:id
 * @desc Busca um funcionário pelo ID
 * @access Autenticado (admin ou próprio funcionário)
 */
router.get('/:id', authMiddleware, funcionarioController.getFuncionarioById);

/**
 * @route PUT /funcionarios/:id
 * @desc Atualiza um funcionário
 * @access Admin
 */
router.put('/:id', authMiddleware, adminMiddleware, validateFuncionario, funcionarioController.updateFuncionario);

/**
 * @route DELETE /funcionarios/:id
 * @desc Exclui um funcionário
 * @access Admin
 */
router.delete('/:id', authMiddleware, adminMiddleware, funcionarioController.deleteFuncionario);

module.exports = router;
