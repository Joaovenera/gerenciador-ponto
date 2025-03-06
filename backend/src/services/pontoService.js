// services/pontoService.js
const Ponto = require('../models/Ponto');
const Funcionario = require('../models/Funcionario');
const gpsService = require('./gpsService');

/**
 * Registra um ponto para um funcionário
 * @param {Object} dados - Dados do registro de ponto
 * @param {Object} req - Objeto de requisição Express
 * @returns {Promise<Object>} - Registro de ponto criado
 */
exports.registrarPonto = async (dados, req) => {
  try {
    const { funcionario_id, tipo, observacao } = dados;
    
    // Verificar se o funcionário existe
    const funcionario = await Funcionario.findById(funcionario_id);
    if (!funcionario) {
      throw new Error('Funcionário não encontrado');
    }
    
    // Verificar se o funcionário está ativo
    if (!funcionario.active) {
      throw new Error('Funcionário inativo');
    }
    
    // Obter dados de localização
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let latitude = dados.latitude;
    let longitude = dados.longitude;
    
    // Se não forneceu coordenadas, tentar obter pelo IP
    if (!latitude || !longitude) {
      try {
        const location = await gpsService.getLocationByIp(ip);
        if (location) {
          latitude = location.latitude;
          longitude = location.longitude;
        }
      } catch (error) {
        console.error('Erro ao obter localização pelo IP:', error);
        // Continuar sem localização
      }
    }
    
    // Verificar se já existe um registro do mesmo tipo no mesmo dia
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    
    const registrosHoje = await Ponto.findByFuncionario(funcionario_id, {
      startDate: hoje,
      endDate: amanha
    });
    
    const registroMesmoTipo = registrosHoje.find(r => r.tipo === tipo);
    if (registroMesmoTipo) {
      throw new Error(`Já existe um registro de ${tipo} para hoje`);
    }
    
    // Criar registro de ponto
    const novoPonto = {
      funcionario_id,
      tipo,
      data_hora: new Date(),
      latitude,
      longitude,
      ip,
      observacao
    };
    
    const result = await Ponto.create(novoPonto);
    const pontoCriado = await Ponto.findById(result.id);
    
    return pontoCriado;
  } catch (error) {
    console.error('Erro ao registrar ponto:', error);
    throw error;
  }
};

/**
 * Corrige um registro de ponto
 * @param {number} id - ID do registro
 * @param {Object} dados - Dados a serem atualizados
 * @param {number} usuarioId - ID do usuário que está corrigindo
 * @returns {Promise<Object>} - Registro atualizado
 */
exports.corrigirPonto = async (id, dados, usuarioId) => {
  try {
    // Verificar se o registro existe
    const ponto = await Ponto.findById(id);
    if (!ponto) {
      throw new Error('Registro de ponto não encontrado');
    }
    
    // Verificar se o funcionário existe (se estiver alterando)
    if (dados.funcionario_id) {
      const funcionario = await Funcionario.findById(dados.funcionario_id);
      if (!funcionario) {
        throw new Error('Funcionário não encontrado');
      }
    }
    
    // Preparar dados para atualização
    const dadosAtualizados = {
      funcionario_id: dados.funcionario_id || ponto.funcionario_id,
      tipo: dados.tipo || ponto.tipo,
      data_hora: dados.data_hora ? new Date(dados.data_hora) : ponto.data_hora,
      observacao: dados.observacao !== undefined ? dados.observacao : ponto.observacao,
      corrigido: true,
      corrigido_por: usuarioId
    };
    
    // Atualizar registro
    await Ponto.update(id, dadosAtualizados);
    const pontoAtualizado = await Ponto.findById(id);
    
    return pontoAtualizado;
  } catch (error) {
    console.error('Erro ao corrigir registro de ponto:', error);
    throw error;
  }
};

/**
 * Obtém o último registro de ponto de um funcionário
 * @param {number} funcionarioId - ID do funcionário
 * @returns {Promise<Object|null>} - Último registro ou null
 */
exports.getUltimoRegistro = async (funcionarioId) => {
  try {
    // Verificar se o funcionário existe
    const funcionario = await Funcionario.findById(funcionarioId);
    if (!funcionario) {
      throw new Error('Funcionário não encontrado');
    }
    
    // Buscar registros do funcionário (limitado a 1, ordenado por data)
    const registros = await Ponto.findByFuncionario(funcionarioId, {
      limit: 1
    });
    
    return registros.length > 0 ? registros[0] : null;
  } catch (error) {
    console.error('Erro ao buscar último registro:', error);
    throw error;
  }
};

/**
 * Verifica se um funcionário pode registrar um ponto
 * @param {number} funcionarioId - ID do funcionário
 * @param {string} tipo - Tipo de registro ('entrada' ou 'saida')
 * @returns {Promise<Object>} - Resultado da verificação
 */
exports.verificarPodeRegistrar = async (funcionarioId, tipo) => {
  try {
    // Verificar se o funcionário existe
    const funcionario = await Funcionario.findById(funcionarioId);
    if (!funcionario) {
      return {
        pode: false,
        mensagem: 'Funcionário não encontrado'
      };
    }
    
    // Verificar se o funcionário está ativo
    if (!funcionario.active) {
      return {
        pode: false,
        mensagem: 'Funcionário inativo'
      };
    }
    
    // Verificar registros do dia
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    
    const registrosHoje = await Ponto.findByFuncionario(funcionarioId, {
      startDate: hoje,
      endDate: amanha
    });
    
    // Verificar se já existe um registro do mesmo tipo
    const registroMesmoTipo = registrosHoje.find(r => r.tipo === tipo);
    if (registroMesmoTipo) {
      return {
        pode: false,
        mensagem: `Já existe um registro de ${tipo} para hoje`
      };
    }
    
    // Se for saída, verificar se tem entrada
    if (tipo === 'saida') {
      const temEntrada = registrosHoje.some(r => r.tipo === 'entrada');
      if (!temEntrada) {
        return {
          pode: false,
          mensagem: 'Não há registro de entrada para hoje'
        };
      }
    }
    
    return {
      pode: true,
      mensagem: 'Pode registrar'
    };
  } catch (error) {
    console.error('Erro ao verificar se pode registrar:', error);
    throw error;
  }
};
