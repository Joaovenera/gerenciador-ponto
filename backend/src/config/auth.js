// config/auth.js
require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'registro-ponto-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'registro-ponto-refresh-secret-key',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  saltRounds: 10 // Para bcrypt
};
