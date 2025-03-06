// middlewares/validation.js
const { body, validationResult } = require('express-validator');

/**
 * Middleware para validar os resultados da validação
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * Validação para login
 */
exports.validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('senha')
    .notEmpty()
    .withMessage('Senha é obrigatória'),
  validate
];

/**
 * Validação para criação/atualização de funcionário
 */
exports.validateFuncionario = [
  body('nome')
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .trim(),
  body('cargo')
    .notEmpty()
    .withMessage('Cargo é obrigatório')
    .trim(),
  body('setor')
    .notEmpty()
    .withMessage('Setor é obrigatório')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('codigo')
    .optional()
    .trim(),
  body('usuario_id')
    .optional()
    .isInt()
    .withMessage('ID de usuário inválido'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Status ativo deve ser um booleano'),
  validate
];

/**
 * Validação para registro de ponto
 */
exports.validatePonto = [
  body('funcionario_id')
    .isInt()
    .withMessage('ID de funcionário inválido'),
  body('tipo')
    .isIn(['entrada', 'saida'])
    .withMessage('Tipo deve ser "entrada" ou "saida"'),
  body('data_hora')
    .optional()
    .isISO8601()
    .withMessage('Data/hora inválida')
    .toDate(),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude inválida'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude inválida'),
  body('ip')
    .optional()
    .isIP()
    .withMessage('IP inválido'),
  body('observacao')
    .optional()
    .trim(),
  validate
];

/**
 * Validação para relatórios
 */
exports.validateRelatorio = [
  body('funcionario_id')
    .optional()
    .isInt()
    .withMessage('ID de funcionário inválido'),
  body('data_inicio')
    .isISO8601()
    .withMessage('Data inicial inválida')
    .toDate(),
  body('data_fim')
    .isISO8601()
    .withMessage('Data final inválida')
    .toDate()
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.data_inicio)) {
        throw new Error('Data final deve ser posterior à data inicial');
      }
      return true;
    }),
  validate
];

/**
 * Validação para criação/atualização de usuário
 */
exports.validateUsuario = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('senha')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('role')
    .optional()
    .isIn(['admin', 'funcionario'])
    .withMessage('Função deve ser "admin" ou "funcionario"'),
  validate
];
