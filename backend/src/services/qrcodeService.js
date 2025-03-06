// services/qrcodeService.js
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

// Garantir que o diretório de upload existe
const qrCodeDir = path.join(__dirname, '../../public/qrcodes');
if (!fs.existsSync(qrCodeDir)) {
  fs.mkdirSync(qrCodeDir, { recursive: true });
}

/**
 * Gera um QR Code para um funcionário
 * @param {string} funcionarioId - ID do funcionário
 * @param {string} nome - Nome do funcionário
 * @returns {Promise<string>} - Caminho para o QR Code gerado
 */
exports.generateQRCode = async (funcionarioId, nome) => {
  try {
    // Criar dados para o QR Code (JSON com ID e nome)
    const qrData = JSON.stringify({
      id: funcionarioId,
      nome: nome,
      timestamp: Date.now() // Para evitar caching
    });
    
    // Definir caminho do arquivo
    const fileName = `funcionario_${funcionarioId}.png`;
    const filePath = path.join(qrCodeDir, fileName);
    
    // Gerar QR Code
    await QRCode.toFile(filePath, qrData, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300
    });
    
    // Retornar URL relativa
    return `/qrcodes/${fileName}`;
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    throw new Error('Não foi possível gerar o QR Code');
  }
};

/**
 * Gera um QR Code em formato base64 para exibição direta
 * @param {string} funcionarioId - ID do funcionário
 * @param {string} nome - Nome do funcionário
 * @returns {Promise<string>} - String base64 do QR Code
 */
exports.generateQRCodeBase64 = async (funcionarioId, nome) => {
  try {
    // Criar dados para o QR Code
    const qrData = JSON.stringify({
      id: funcionarioId,
      nome: nome,
      timestamp: Date.now()
    });
    
    // Gerar QR Code como string base64
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300
    });
    
    return qrCodeBase64;
  } catch (error) {
    console.error('Erro ao gerar QR Code base64:', error);
    throw new Error('Não foi possível gerar o QR Code');
  }
};

/**
 * Verifica se um QR Code é válido
 * @param {string} qrData - Dados do QR Code
 * @returns {Promise<Object>} - Resultado da verificação
 */
exports.validateQRCode = async (qrData) => {
  try {
    // Verificar se os dados são um JSON válido
    let data;
    try {
      data = JSON.parse(qrData);
    } catch (e) {
      return {
        valid: false,
        message: 'QR Code inválido: formato incorreto'
      };
    }
    
    // Verificar se contém os campos necessários
    if (!data.id || !data.nome) {
      return {
        valid: false,
        message: 'QR Code inválido: dados incompletos'
      };
    }
    
    return {
      valid: true,
      funcionarioId: data.id,
      nome: data.nome
    };
  } catch (error) {
    console.error('Erro ao validar QR Code:', error);
    return {
      valid: false,
      message: 'Erro ao validar QR Code'
    };
  }
};
