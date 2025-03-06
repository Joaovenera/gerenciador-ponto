// controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');
const Funcionario = require('../models/Funcionario');
const authConfig = require('../config/auth');
const authService = require('../services/authService');

/**
 * Autentica o usuário e retorna um token JWT
 * @route POST /auth/login
 * @access Público
 */
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    // Buscar usuário pelo email
    const usuario = await Usuario.findByEmail(email);
    if (!usuario) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    
    // Verificar senha
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    
    // Gerar token JWT
    const token = jwt.sign(
      { id: usuario.id, role: usuario.role },
      authConfig.secret,
      { expiresIn: authConfig.expiresIn }
    );
    
    // Gerar refresh token
    const refreshToken = authService.generateRefreshToken(usuario.id);
    
    // Buscar informações do funcionário (se existir)
    let funcionario = null;
    if (usuario.role === 'funcionario') {
      funcionario = await Funcionario.findByUsuarioId(usuario.id);
    }
    
    return res.json({
      token,
      refreshToken,
      user: {
        id: usuario.id,
        email: usuario.email,
        role: usuario.role,
        funcionario: funcionario ? {
          id: funcionario.id,
          nome: funcionario.nome,
          cargo: funcionario.cargo,
          setor: funcionario.setor
        } : null
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Encerra a sessão do usuário
 * @route POST /auth/logout
 * @access Autenticado
 */
exports.logout = (req, res) => {
  try {
    // Como JWT é stateless, o logout acontece apenas no cliente
    // No entanto, podemos invalidar o refresh token
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      authService.invalidateRefreshToken(refreshToken);
    }
    
    return res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro no logout:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Atualiza o token JWT usando um refresh token
 * @route POST /auth/refresh
 * @access Público
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token não fornecido' });
    }
    
    // Verificar se o refresh token é válido
    const userId = await authService.validateRefreshToken(refreshToken);
    if (!userId) {
      return res.status(401).json({ message: 'Refresh token inválido ou expirado' });
    }
    
    // Buscar usuário
    const usuario = await Usuario.findById(userId);
    if (!usuario) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }
    
    // Gerar novo token JWT
    const token = jwt.sign(
      { id: usuario.id, role: usuario.role },
      authConfig.secret,
      { expiresIn: authConfig.expiresIn }
    );
    
    // Gerar novo refresh token
    const newRefreshToken = authService.generateRefreshToken(usuario.id);
    
    return res.json({
      token,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Erro ao atualizar token:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Verifica se o token é válido
 * @route GET /auth/verify
 * @access Autenticado
 */
exports.verifyToken = (req, res) => {
  // Se chegou até aqui, o token é válido (middleware de autenticação)
  return res.json({
    valid: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
};
