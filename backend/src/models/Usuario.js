// models/Usuario.js
const { db, run, get, all } = require('../config/database');
const bcrypt = require('bcrypt');
const authConfig = require('../config/auth');

class Usuario {
  /**
   * Cria um novo usuário
   * @param {Object} usuario - Dados do usuário
   * @returns {Promise<Object>} - ID do usuário criado
   */
  static async create(usuario) {
    try {
      // Hash da senha
      const salt = await bcrypt.genSalt(authConfig.saltRounds);
      const senhaHash = await bcrypt.hash(usuario.senha, salt);
      
      const result = await run(
        `INSERT INTO usuarios (email, senha, role, created_at, updated_at) 
         VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
        [usuario.email, senhaHash, usuario.role || 'funcionario']
      );
      
      return result;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }
  
  /**
   * Busca um usuário pelo ID
   * @param {number} id - ID do usuário
   * @returns {Promise<Object|null>} - Dados do usuário
   */
  static async findById(id) {
    try {
      const usuario = await get(
        'SELECT id, email, role, created_at, updated_at FROM usuarios WHERE id = ?',
        [id]
      );
      
      return usuario || null;
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error);
      throw error;
    }
  }
  
  /**
   * Busca um usuário pelo email
   * @param {string} email - Email do usuário
   * @returns {Promise<Object|null>} - Dados do usuário (incluindo senha para autenticação)
   */
  static async findByEmail(email) {
    try {
      const usuario = await get(
        'SELECT id, email, senha, role, created_at, updated_at FROM usuarios WHERE email = ?',
        [email]
      );
      
      return usuario || null;
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      throw error;
    }
  }
  
  /**
   * Atualiza os dados de um usuário
   * @param {number} id - ID do usuário
   * @param {Object} dados - Dados a serem atualizados
   * @returns {Promise<void>}
   */
  static async update(id, dados) {
    try {
      const fields = [];
      const values = [];
      
      // Construir campos a serem atualizados
      if (dados.email) {
        fields.push('email = ?');
        values.push(dados.email);
      }
      
      if (dados.senha) {
        const salt = await bcrypt.genSalt(authConfig.saltRounds);
        const senhaHash = await bcrypt.hash(dados.senha, salt);
        fields.push('senha = ?');
        values.push(senhaHash);
      }
      
      if (dados.role) {
        fields.push('role = ?');
        values.push(dados.role);
      }
      
      fields.push('updated_at = datetime("now")');
      values.push(id);
      
      await run(
        `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }
  
  /**
   * Exclui um usuário
   * @param {number} id - ID do usuário
   * @returns {Promise<void>}
   */
  static async delete(id) {
    try {
      await run('DELETE FROM usuarios WHERE id = ?', [id]);
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      throw error;
    }
  }
  
  /**
   * Lista todos os usuários
   * @param {Object} options - Opções de paginação
   * @returns {Promise<Array>} - Lista de usuários
   */
  static async findAll(options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;
      
      const usuarios = await all(
        `SELECT id, email, role, created_at, updated_at 
         FROM usuarios 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      
      return usuarios;
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      throw error;
    }
  }
  
  /**
   * Conta o total de usuários
   * @returns {Promise<number>} - Total de usuários
   */
  static async count() {
    try {
      const result = await get('SELECT COUNT(*) as total FROM usuarios');
      return result.total;
    } catch (error) {
      console.error('Erro ao contar usuários:', error);
      throw error;
    }
  }
}

module.exports = Usuario;
