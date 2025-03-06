// controllers/utilsController.js
const Funcionario = require('../models/Funcionario');
const qrcodeService = require('../services/qrcodeService');
const gpsService = require('../services/gpsService');

/**
 * Gera um QR Code para um funcionário
 * @route GET /utils/qrcode/:id
 * @access Autenticado
 */
exports.generateQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o funcionário existe
    const funcionario = await Funcionario.findById(id);
    if (!funcionario) {
      return res.status(404).json({ message: 'Funcionário não encontrado' });
    }
    
    // Verificar permissão (admin ou próprio funcionário)
    const isAdmin = req.user.role === 'admin';
    const isSelf = funcionario.usuario_id === req.user.id;
    
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: 'Sem permissão para gerar QR Code para este funcionário' });
    }
    
    // Gerar QR Code
    const qrCodeBase64 = await qrcodeService.generateQRCodeBase64(funcionario.id, funcionario.nome);
    
    return res.json({
      funcionario: {
        id: funcionario.id,
        nome: funcionario.nome,
        codigo: funcionario.codigo
      },
      qrCode: qrCodeBase64
    });
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Obtém a localização do funcionário no registro
 * @route GET /utils/gps
 * @access Autenticado
 */
exports.getLocation = async (req, res) => {
  try {
    // Obter localização do cliente
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Tentar obter localização pelo IP
    const locationByIp = await gpsService.getLocationByIp(ip);
    
    return res.json({
      ip,
      location: locationByIp
    });
  } catch (error) {
    console.error('Erro ao obter localização:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Verifica se um código de funcionário é válido
 * @route GET /utils/verificar-codigo/:codigo
 * @access Público
 */
exports.verificarCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;
    
    // Verificar se o código existe
    const funcionario = await Funcionario.findByCodigo(codigo);
    
    if (!funcionario) {
      return res.status(404).json({ 
        valid: false,
        message: 'Código inválido ou não encontrado' 
      });
    }
    
    // Verificar se o funcionário está ativo
    if (!funcionario.active) {
      return res.status(400).json({ 
        valid: false,
        message: 'Funcionário inativo' 
      });
    }
    
    return res.json({
      valid: true,
      funcionario: {
        id: funcionario.id,
        nome: funcionario.nome,
        cargo: funcionario.cargo,
        setor: funcionario.setor
      }
    });
  } catch (error) {
    console.error('Erro ao verificar código:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
