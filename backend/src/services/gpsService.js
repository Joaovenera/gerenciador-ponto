// services/gpsService.js
const axios = require('axios');

/**
 * Obtém a localização a partir do IP
 * @param {string} ip - Endereço IP
 * @returns {Promise<Object|null>} - Dados de localização ou null
 */
exports.getLocationByIp = async (ip) => {
  try {
    // Remover IPv6 prefix se existir
    const cleanIp = ip.replace(/^::ffff:/, '');
    
    // Verificar se é localhost ou IP privado
    if (cleanIp === '127.0.0.1' || cleanIp === 'localhost' || isPrivateIp(cleanIp)) {
      // Para desenvolvimento local, retornar uma localização padrão
      return {
        ip: cleanIp,
        latitude: -23.5505, // São Paulo
        longitude: -46.6333,
        city: 'São Paulo',
        region: 'São Paulo',
        country: 'Brazil',
        timezone: 'America/Sao_Paulo'
      };
    }
    
    // Usar API pública para obter localização
    // Nota: Em produção, considere usar uma API com chave de API
    const response = await axios.get(`https://ipapi.co/${cleanIp}/json/`);
    
    if (response.data && !response.data.error) {
      return {
        ip: cleanIp,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        city: response.data.city,
        region: response.data.region,
        country: response.data.country_name,
        timezone: response.data.timezone
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao obter localização pelo IP:', error);
    
    // Em caso de erro, retornar localização padrão para não interromper o fluxo
    return {
      ip: ip,
      latitude: -23.5505, // São Paulo
      longitude: -46.6333,
      city: 'São Paulo',
      region: 'São Paulo',
      country: 'Brazil',
      timezone: 'America/Sao_Paulo'
    };
  }
};

/**
 * Calcula a distância entre duas coordenadas em km (fórmula de Haversine)
 * @param {number} lat1 - Latitude do ponto 1
 * @param {number} lon1 - Longitude do ponto 1
 * @param {number} lat2 - Latitude do ponto 2
 * @param {number} lon2 - Longitude do ponto 2
 * @returns {number} - Distância em km
 */
exports.calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

/**
 * Verifica se um funcionário está dentro de um raio de distância de um local
 * @param {number} lat1 - Latitude do funcionário
 * @param {number} lon1 - Longitude do funcionário
 * @param {number} lat2 - Latitude do local
 * @param {number} lon2 - Longitude do local
 * @param {number} maxDistance - Distância máxima em km
 * @returns {boolean} - Verdadeiro se estiver dentro do raio
 */
exports.isWithinRadius = (lat1, lon1, lat2, lon2, maxDistance = 0.1) => {
  const distance = exports.calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= maxDistance;
};

/**
 * Converte graus para radianos
 * @param {number} degrees - Ângulo em graus
 * @returns {number} - Ângulo em radianos
 */
function toRad(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * Verifica se um IP é privado
 * @param {string} ip - Endereço IP
 * @returns {boolean} - Verdadeiro se for IP privado
 */
function isPrivateIp(ip) {
  // Verificar se é IPv4 privado
  const ipv4Regex = /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.)/;
  return ipv4Regex.test(ip);
}
