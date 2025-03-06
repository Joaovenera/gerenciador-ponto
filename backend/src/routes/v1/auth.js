// routes/v1/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authcontroller');
const { validateLogin } = require('../../middlewares/validation');
const { authMiddleware } = require('../../middlewares/auth');

/**
 * @route POST /auth/login
 * @desc Autentica o usuário e retorna um token JWT
 * @access Público
 */
router.post('/login', validateLogin, authController.login);

/**
 * @route POST /auth/logout
 * @desc Encerra a sessão do usuário
 * @access Autenticado
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @route POST /auth/refresh
 * @desc Atualiza o token JWT usando um refresh token
 * @access Público
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route GET /auth/verify
 * @desc Verifica se o token é válido
 * @access Autenticado
 */
router.get('/verify', authMiddleware, authController.verifyToken);

module.exports = router;
