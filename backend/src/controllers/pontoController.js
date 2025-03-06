// controllers/pontoController.js
const Ponto = require('../models/Ponto');
const Funcionario = require('../models/Funcionario');

exports.registrarPonto = async (req, res) => {
  try {
    const { funcionario_id, tipo } = req.body;
    const { latitude, longitude, ip } = req.body;
    
    // Verificar se o funcionário existe
    const funcionario = await Funcionario.findById(funcionario_id);
    if (!funcionario) {
      return res.status(404).json({ message: 'Funcionário não encontrado' });
    }
    
    // Verificar se o usuário atual tem permissão (é admin ou o próprio funcionário)
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isAdmin && funcionario.usuario_id !== userId) {
      return res.status(403).json({ message: 'Sem permissão para registrar ponto para este funcionário' });
    }
    
    // Registrar ponto
    const novoPonto = {
      funcionario_id,
      tipo,
      data_hora: new Date(),
      latitude,
      longitude,
      ip,
      observacao: req.body.observacao || null
    };
    
    const pontoId = await Ponto.create(novoPonto);
    const pontoCriado = await Ponto.findById(pontoId);
    
    return res.status(201).json(pontoCriado);
  } catch (error) {
    console.error('Erro ao registrar ponto:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.getAllPontos = async (req, res) => {
  try {
    // Parâmetros de paginação e filtro
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    
    const pontos = await Ponto.findAll({ page, limit, startDate, endDate });
    const total = await Ponto.count({ startDate, endDate });
    
    return res.json({
      pontos,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Erro ao listar pontos:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.getPontosByFuncionario = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    
    // Verificar se o funcionário existe
    const funcionario = await Funcionario.findById(id);
    if (!funcionario) {
      return res.status(404).json({ message: 'Funcionário não encontrado' });
    }
    
    // Verificar permissão (admin ou próprio funcionário)
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isAdmin && funcionario.usuario_id !== userId) {
      return res.status(403).json({ message: 'Sem permissão para acessar estes registros' });
    }
    
    const pontos = await Ponto.findByFuncionario(id, { page, limit, startDate, endDate });
    const total = await Ponto.countByFuncionario(id, { startDate, endDate });
    
    return res.json({
      pontos,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Erro ao buscar pontos do funcionário:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.getPontoById = async (req, res) => {
  try {
    const { id } = req.params;
    const ponto = await Ponto.findById(id);
    
    if (!ponto) {
      return res.status(404).json({ message: 'Registro de ponto não encontrado' });
    }
    
    // Verificar permissão (admin ou próprio funcionário)
    const funcionario = await Funcionario.findById(ponto.funcionario_id);
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isAdmin && funcionario.usuario_id !== userId) {
      return res.status(403).json({ message: 'Sem permissão para acessar este registro' });
    }
    
    return res.json(ponto);
  } catch (error) {
    console.error('Erro ao buscar registro de ponto:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.updatePonto = async (req, res) => {
  try {
    const { id } = req.params;
    const { funcionario_id, tipo, data_hora, observacao } = req.body;
    
    // Verificar se o registro existe
    const ponto = await Ponto.findById(id);
    if (!ponto) {
      return res.status(404).json({ message: 'Registro de ponto não encontrado' });
    }
    
    // Apenas admin pode modificar registros
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Apenas administradores podem modificar registros' });
    }
    
    const dadosAtualizados = {
      funcionario_id: funcionario_id || ponto.funcionario_id,
      tipo: tipo || ponto.tipo,
      data_hora: data_hora ? new Date(data_hora) : ponto.data_hora,
      observacao: observacao !== undefined ? observacao : ponto.observacao,
      corrigido: true,
      corrigido_por: req.user.id,
      updated_at: new Date()
    };
    
    await Ponto.update(id, dadosAtualizados);
    const pontoAtualizado = await Ponto.findById(id);
    
    return res.json(pontoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar registro de ponto:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.deletePonto = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o registro existe
    const ponto = await Ponto.findById(id);
    if (!ponto) {
      return res.status(404).json({ message: 'Registro de ponto não encontrado' });
    }
    
    // Apenas admin pode excluir registros
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Apenas administradores podem excluir registros' });
    }
    
    await Ponto.delete(id);
    
    return res.json({ message: 'Registro de ponto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir registro de ponto:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};