// utils/validations.js

/**
 * Valida um endereço de email
 * @param {string} email - Email a ser validado
 * @returns {boolean} - Verdadeiro se o email for válido
 */
exports.isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida uma senha
 * @param {string} password - Senha a ser validada
 * @param {Object} options - Opções de validação
 * @returns {Object} - Resultado da validação
 */
exports.validatePassword = (password, options = {}) => {
  const {
    minLength = 6,
    requireUppercase = false,
    requireLowercase = false,
    requireNumbers = false,
    requireSpecialChars = false
  } = options;
  
  const result = {
    isValid: true,
    errors: []
  };
  
  // Verificar comprimento mínimo
  if (password.length < minLength) {
    result.isValid = false;
    result.errors.push(`A senha deve ter pelo menos ${minLength} caracteres`);
  }
  
  // Verificar letra maiúscula
  if (requireUppercase && !/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push('A senha deve conter pelo menos uma letra maiúscula');
  }
  
  // Verificar letra minúscula
  if (requireLowercase && !/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push('A senha deve conter pelo menos uma letra minúscula');
  }
  
  // Verificar números
  if (requireNumbers && !/[0-9]/.test(password)) {
    result.isValid = false;
    result.errors.push('A senha deve conter pelo menos um número');
  }
  
  // Verificar caracteres especiais
  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    result.isValid = false;
    result.errors.push('A senha deve conter pelo menos um caractere especial');
  }
  
  return result;
};

/**
 * Valida uma data
 * @param {string} dateString - Data a ser validada
 * @returns {boolean} - Verdadeiro se a data for válida
 */
exports.isValidDate = (dateString) => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Valida coordenadas de latitude e longitude
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {boolean} - Verdadeiro se as coordenadas forem válidas
 */
exports.isValidCoordinates = (latitude, longitude) => {
  return (
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

/**
 * Valida um endereço IP
 * @param {string} ip - Endereço IP a ser validado
 * @returns {boolean} - Verdadeiro se o IP for válido
 */
exports.isValidIp = (ip) => {
  // Validar IPv4
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => parseInt(part) <= 255);
  }
  
  // Validar IPv6
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv6Regex.test(ip);
};

/**
 * Sanitiza uma string para evitar injeção de SQL
 * @param {string} str - String a ser sanitizada
 * @returns {string} - String sanitizada
 */
exports.sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  
  // Remover caracteres que podem ser usados para injeção de SQL
  return str
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
};

/**
 * Formata uma data para o formato brasileiro
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} - Data formatada
 */
exports.formatDateBR = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Formata uma data e hora para o formato brasileiro
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} - Data e hora formatadas
 */
exports.formatDateTimeBR = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Formata um número para o formato de moeda brasileira
 * @param {number} value - Valor a ser formatado
 * @returns {string} - Valor formatado
 */
exports.formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formata um número para o formato decimal brasileiro
 * @param {number} value - Valor a ser formatado
 * @param {number} decimals - Número de casas decimais
 * @returns {string} - Valor formatado
 */
exports.formatDecimal = (value, decimals = 2) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};
