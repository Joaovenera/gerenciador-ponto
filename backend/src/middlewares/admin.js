// middlewares/admin.js
/**
 * Middleware para verificar permissões de administrador
 * Deve ser usado após o middleware de autenticação
 */
const adminMiddleware = (req, res, next) => {
  // Verificar se o usuário está autenticado
  if (!req.user) {
    return res.status(401).json({ message: 'Autenticação necessária' });
  }
  
  // Verificar se o usuário tem permissão de administrador
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Permissão de administrador necessária.' });
  }
  
  return next();
};

module.exports = adminMiddleware;
