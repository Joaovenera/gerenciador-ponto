// routes/v1/utils.js
const express = require('express');
const router = express.Router();
const utilsController = require('../../controllers/utilsController');
const { authMiddleware } = require('../../middlewares/auth');
const adminMiddleware = require('../../middlewares/admin');

/**
 * @route GET /utils/qrcode/:id
 * @desc Gera um QR Code para um funcionário
 * @access Autenticado (admin ou próprio funcionário)
 */
router.get('/qrcode/:id', authMiddleware, utilsController.generateQRCode);

/**
 * @route GET /utils/gps
 * @desc Obtém a localização do funcionário no registro
 * @access Autenticado
 */
router.get('/gps', authMiddleware, utilsController.getLocation);

/**
 * @route GET /utils/verificar-codigo/:codigo
 * @desc Verifica se um código de funcionário é válido
 * @access Público
 */
router.get('/verificar-codigo/:codigo', utilsController.verificarCodigo);

module.exports = router;
