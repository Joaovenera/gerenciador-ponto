// controllers/funcionarioController.js
const Funcionario = require('../models/Funcionario');
const Usuario = require('../models/Usuario');
const qrcodeService = require('../services/qrcodeService');

/**
 * Cria um novo funcionário
 * @route POST /funcionarios
 * @access Admin
 */
exports.createFuncionario = async (req, res) => {
  try {
    const { nome, cargo, setor, email, usuario_id, active } = req.body;
    
    // Verificar se já existe um funcionário com este email
    const funcionarioExistente = await Funcionario.findByEmail(email);
    if (funcionarioExistente) {
      return res.status(400).json({ message: 'Já existe um funcionário com este email' });
    }
    
    // Verificar se o usuário existe (se fornecido)
    if (usuario_id) {
      const usuario = await Usuario.findById(usuario_id);
      if (!usuario) {
        return res.status(400).json({ message: 'Usuário não encontrado' });
      }
      
      // Verificar se o usuário já está associado a outro funcionário
      const funcionarioUsuario = await Funcionario.findByUsuarioId(usuario_id);
      if (funcionarioUsuario) {
        return res.status(400).json({ message: 'Este usuário já está associado a outro funcionário' });
      }
    }
    
    // Criar funcionário
    const result = await Funcionario.create({
      nome,
      cargo,
      setor,
      email,
      usuario_id,
      active
    });
    
    // Gerar QR Code para o funcionário
    const qrCodeBase64 = await qrcodeService.generateQRCodeBase64(result.id, nome);
    
    // Buscar o funcionário criado
    const funcionario = await Funcionario.findById(result.id);
    
    return res.status(201).json({
      funcionario,
      qrCode: qrCodeBase64
    });
  } catch (error) {
    console.error('Erro ao criar funcionário:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Lista todos os funcionários
 * @route GET /funcionarios
 * @access Autenticado
 */
exports.getAllFuncionarios = async (req, res) => {
  try {
    // Parâmetros de paginação e filtro
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const active = req.query.active !== undefined ? req.query.active === 'true' : undefined;
    const search = req.query.search || '';
    
    const funcionarios = await Funcionario.findAll({ page, limit, active, search });
    const total = await Funcionario.count({ active, search });
    
    return res.json({
      funcionarios,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Erro ao listar funcionários:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Busca um funcionário pelo ID
 * @route GET /funcionarios/:id
 * @access Autenticado
 */
exports.getFuncionarioById = async (req, res) => {
  try {
    const { id } = req.params;
    const funcionario = await Funcionario.findById(id);
    
    if (!funcionario) {
      return res.status(404).json({ message: 'Funcionário não encontrado' });
    }
    
    // Verificar permissão (admin ou próprio funcionário)
    const isAdmin = req.user.role === 'admin';
    const isSelf = funcionario.usuario_id === req.user.id;
    
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: 'Sem permissão para acessar este recurso' });
    }
    
    return res.json(funcionario);
  } catch (error) {
    console.error('Erro ao buscar funcionário:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Atualiza um funcionário
 * @route PUT /funcionarios/:id
 * @access Admin
 */
exports.updateFuncionario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cargo, setor, email, usuario_id, active } = req.body;
    
    // Verificar se o funcionário existe
    const funcionario = await Funcionario.findById(id);
    if (!funcionario) {
      return res.status(404).json({ message: 'Funcionário não encontrado' });
    }
    
    // Verificar se o email já está em uso por outro funcionário
    if (email && email !== funcionario.email) {
      const funcionarioExistente = await Funcionario.findByEmail(email);
      if (funcionarioExistente && funcionarioExistente.id !== parseInt(id)) {
        return res.status(400).json({ message: 'Este email já está em uso por outro funcionário' });
      }
    }
    
    // Verificar se o usuário existe (se fornecido)
    if (usuario_id !== undefined) {
      if (usuario_id) {
        const usuario = await Usuario.findById(usuario_id);
        if (!usuario) {
          return res.status(400).json({ message: 'Usuário não encontrado' });
        }
        
        // Verificar se o usuário já está associado a outro funcionário
        const funcionarioUsuario = await Funcionario.findByUsuarioId(usuario_id);
        if (funcionarioUsuario && funcionarioUsuario.id !== parseInt(id)) {
          return res.status(400).json({ message: 'Este usuário já está associado a outro funcionário' });
        }
      }
    }
    
    // Atualizar funcionário
    await Funcionario.update(id, {
      nome,
      cargo,
      setor,
      email,
      usuario_id,
      active
    });
    
    // Buscar o funcionário atualizado
    const funcionarioAtualizado = await Funcionario.findById(id);
    
    return res.json(funcionarioAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Exclui um funcionário
 * @route DELETE /funcionarios/:id
 * @access Admin
 */
exports.deleteFuncionario = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o funcionário existe
    const funcionario = await Funcionario.findById(id);
    if (!funcionario) {
      return res.status(404).json({ message: 'Funcionário não encontrado' });
    }
    
    // Excluir funcionário
    await Funcionario.delete(id);
    
    return res.json({ message: 'Funcionário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir funcionário:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
