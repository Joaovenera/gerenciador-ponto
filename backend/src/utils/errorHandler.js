// utils/errorHandler.js

/**
 * Middleware para tratamento de erros
 * Captura erros e retorna respostas de erro padronizadas
 */
const errorHandler = (err, req, res, next) => {
  console.error('Erro na aplicação:', err);
  
  // Verificar se é um erro conhecido
  if (err.name === 'ValidationError') {
    // Erro de validação (mongoose/joi/etc)
    return res.status(400).json({
      error: 'Erro de validação',
      details: err.message
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    // Erro de autenticação JWT
    return res.status(401).json({
      error: 'Não autorizado',
      details: 'Token inválido ou expirado'
    });
  }
  
  if (err.name === 'ForbiddenError') {
    // Erro de permissão
    return res.status(403).json({
      error: 'Acesso negado',
      details: err.message
    });
  }
  
  if (err.name === 'NotFoundError') {
    // Recurso não encontrado
    return res.status(404).json({
      error: 'Não encontrado',
      details: err.message
    });
  }
  
  // Erro interno do servidor (padrão)
  return res.status(500).json({
    error: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'production' ? 'Ocorreu um erro inesperado' : err.message
  });
};

/**
 * Classe para erros de validação
 */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Classe para erros de autenticação
 */
class UnauthorizedError extends Error {
  constructor(message = 'Não autorizado') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Classe para erros de permissão
 */
class ForbiddenError extends Error {
  constructor(message = 'Acesso negado') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Classe para erros de recurso não encontrado
 */
class NotFoundError extends Error {
  constructor(message = 'Recurso não encontrado') {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Middleware para tratar rotas não encontradas
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Rota não encontrada: ${req.originalUrl}`);
  next(error);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError
};
