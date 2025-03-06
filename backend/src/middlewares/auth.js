// middlewares/auth.js
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const Usuario = require('../models/Usuario');

/**
 * Middleware de autenticação
 * Verifica se o token JWT é válido e adiciona o usuário à requisição
 */
exports.authMiddleware = async (req, res, next) => {
  try {
    // Obter o token do cabeçalho Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }
    
    // Verificar formato do token (Bearer <token>)
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2) {
      return res.status(401).json({ message: 'Erro no formato do token' });
    }
    
    const [scheme, token] = parts;
    
    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({ message: 'Token mal formatado' });
    }
    
    // Verificar validade do token
    jwt.verify(token, authConfig.secret, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Token inválido' });
      }
      
      // Buscar usuário no banco de dados
      const usuario = await Usuario.findById(decoded.id);
      
      if (!usuario) {
        return res.status(401).json({ message: 'Usuário não encontrado' });
      }
      
      // Adicionar informações do usuário à requisição
      req.user = {
        id: usuario.id,
        email: usuario.email,
        role: usuario.role
      };
      
      return next();
    });
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Middleware para verificar permissões de administrador
 * Deve ser usado após o middleware de autenticação
 */
exports.adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Permissão de administrador necessária.' });
  }
  
  return next();
};
