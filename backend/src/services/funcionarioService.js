// services/funcionarioService.js
const Funcionario = require('../models/Funcionario');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');
const authConfig = require('../config/auth');
const qrcodeService = require('./qrcodeService');

/**
 * Cria um novo funcionário com usuário associado
 * @param {Object} dados - Dados do funcionário e usuário
 * @returns {Promise<Object>} - Funcionário e usuário criados
 */
exports.criarFuncionarioComUsuario = async (dados) => {
  try {
    const { nome, cargo, setor, email, senha, role = 'funcionario' } = dados;
    
    // Verificar se já existe um funcionário com este email
    const funcionarioExistente = await Funcionario.findByEmail(email);
    if (funcionarioExistente) {
      throw new Error('Já existe um funcionário com este email');
    }
    
    // Verificar se já existe um usuário com este email
    const usuarioExistente = await Usuario.findByEmail(email);
    if (usuarioExistente) {
      throw new Error('Já existe um usuário com este email');
    }
    
    // Criar usuário
    const salt = await bcrypt.genSalt(authConfig.saltRounds);
    const senhaHash = await bcrypt.hash(senha, salt);
    
    const usuarioResult = await Usuario.create({
      email,
      senha: senhaHash,
      role
    });
    
    // Criar funcionário associado ao usuário
    const funcionarioResult = await Funcionario.create({
      nome,
      cargo,
      setor,
      email,
      usuario_id: usuarioResult.id,
      active: true
    });
    
    // Gerar QR Code para o funcionário
    const qrCodeBase64 = await qrcodeService.generateQRCodeBase64(funcionarioResult.id, nome);
    
    // Buscar o funcionário criado
    const funcionario = await Funcionario.findById(funcionarioResult.id);
    
    return {
      funcionario,
      qrCode: qrCodeBase64
    };
  } catch (error) {
    console.error('Erro ao criar funcionário com usuário:', error);
    throw error;
  }
};

/**
 * Atualiza um funcionário e seu usuário associado
 * @param {number} id - ID do funcionário
 * @param {Object} dados - Dados a serem atualizados
 * @returns {Promise<Object>} - Funcionário atualizado
 */
exports.atualizarFuncionarioComUsuario = async (id, dados) => {
  try {
    const { nome, cargo, setor, email, senha, active } = dados;
    
    // Verificar se o funcionário existe
    const funcionario = await Funcionario.findById(id);
    if (!funcionario) {
      throw new Error('Funcionário não encontrado');
    }
    
    // Verificar se o email já está em uso por outro funcionário
    if (email && email !== funcionario.email) {
      const funcionarioExistente = await Funcionario.findByEmail(email);
      if (funcionarioExistente && funcionarioExistente.id !== parseInt(id)) {
        throw new Error('Este email já está em uso por outro funcionário');
      }
    }
    
    // Atualizar funcionário
    await Funcionario.update(id, {
      nome,
      cargo,
      setor,
      email,
      active
    });
    
    // Atualizar usuário associado (se existir)
    if (funcionario.usuario_id) {
      const dadosUsuario = {};
      
      if (email) {
        dadosUsuario.email = email;
      }
      
      if (senha) {
        dadosUsuario.senha = senha;
      }
      
      if (Object.keys(dadosUsuario).length > 0) {
        await Usuario.update(funcionario.usuario_id, dadosUsuario);
      }
    }
    
    // Buscar o funcionário atualizado
    const funcionarioAtualizado = await Funcionario.findById(id);
    
    return funcionarioAtualizado;
  } catch (error) {
    console.error('Erro ao atualizar funcionário com usuário:', error);
    throw error;
  }
};

/**
 * Exclui um funcionário e seu usuário associado
 * @param {number} id - ID do funcionário
 * @returns {Promise<void>}
 */
exports.excluirFuncionarioComUsuario = async (id) => {
  try {
    // Verificar se o funcionário existe
    const funcionario = await Funcionario.findById(id);
    if (!funcionario) {
      throw new Error('Funcionário não encontrado');
    }
    
    // Excluir funcionário
    await Funcionario.delete(id);
    
    // Excluir usuário associado (se existir)
    if (funcionario.usuario_id) {
      await Usuario.delete(funcionario.usuario_id);
    }
  } catch (error) {
    console.error('Erro ao excluir funcionário com usuário:', error);
    throw error;
  }
};
