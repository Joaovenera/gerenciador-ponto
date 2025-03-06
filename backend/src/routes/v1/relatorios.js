// routes/v1/relatorios.js
const express = require('express');
const router = express.Router();
const relatorioController = require('../../controllers/relatorioController');
const { authMiddleware } = require('../../middlewares/auth');
const adminMiddleware = require('../../middlewares/admin');
const { validateRelatorio } = require('../../middlewares/validation');

/**
 * @route GET /relatorios/horas-trabalhadas
 * @desc Calcula total de horas trabalhadas por período
 * @access Autenticado
 */
router.get('/horas-trabalhadas', authMiddleware, relatorioController.calcularHorasTrabalhadas);

/**
 * @route GET /relatorios/export/excel
 * @desc Exporta os registros para Excel
 * @access Autenticado
 */
router.get('/export/excel', authMiddleware, relatorioController.exportToExcel);

/**
 * @route GET /relatorios/export/pdf
 * @desc Exporta os registros para PDF
 * @access Autenticado
 */
router.get('/export/pdf', authMiddleware, relatorioController.exportToPDF);

module.exports = router;
