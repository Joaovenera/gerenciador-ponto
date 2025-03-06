// services/authService.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authConfig = require('../config/auth');

// Armazenamento em memória para refresh tokens (em produção, usar Redis ou banco de dados)
const refreshTokens = new Map();

/**
 * Gera um novo refresh token para um usuário
 * @param {number} userId - ID do usuário
 * @returns {string} - Refresh token gerado
 */
exports.generateRefreshToken = (userId) => {
  // Gerar token aleatório
  const refreshToken = crypto.randomBytes(40).toString('hex');
  
  // Armazenar token com data de expiração
  const expiresIn = authConfig.refreshExpiresIn || '7d';
  let expirationMs;
  
  if (expiresIn.endsWith('d')) {
    expirationMs = parseInt(expiresIn) * 24 * 60 * 60 * 1000;
  } else if (expiresIn.endsWith('h')) {
    expirationMs = parseInt(expiresIn) * 60 * 60 * 1000;
  } else if (expiresIn.endsWith('m')) {
    expirationMs = parseInt(expiresIn) * 60 * 1000;
  } else {
    expirationMs = 7 * 24 * 60 * 60 * 1000; // 7 dias padrão
  }
  
  const expiresAt = Date.now() + expirationMs;
  
  refreshTokens.set(refreshToken, {
    userId,
    expiresAt
  });
  
  return refreshToken;
};

/**
 * Valida um refresh token
 * @param {string} refreshToken - Refresh token a ser validado
 * @returns {number|null} - ID do usuário ou null se inválido
 */
exports.validateRefreshToken = (refreshToken) => {
  if (!refreshTokens.has(refreshToken)) {
    return null;
  }
  
  const tokenData = refreshTokens.get(refreshToken);
  
  // Verificar se o token expirou
  if (tokenData.expiresAt < Date.now()) {
    refreshTokens.delete(refreshToken);
    return null;
  }
  
  return tokenData.userId;
};

/**
 * Invalida um refresh token
 * @param {string} refreshToken - Refresh token a ser invalidado
 */
exports.invalidateRefreshToken = (refreshToken) => {
  refreshTokens.delete(refreshToken);
};

/**
 * Limpa tokens expirados (pode ser chamado periodicamente)
 */
exports.cleanupExpiredTokens = () => {
  const now = Date.now();
  
  for (const [token, data] of refreshTokens.entries()) {
    if (data.expiresAt < now) {
      refreshTokens.delete(token);
    }
  }
};

// Configurar limpeza periódica de tokens expirados (a cada hora)
setInterval(exports.cleanupExpiredTokens, 60 * 60 * 1000);
