// models/Funcionario.js
const { db, run, get, all } = require('../config/database');
const crypto = require('crypto');

class Funcionario {
  /**
   * Cria um novo funcionário
   * @param {Object} funcionario - Dados do funcionário
   * @returns {Promise<Object>} - ID do funcionário criado
   */
  static async create(funcionario) {
    try {
      // Gerar código único para o funcionário (para QR Code)
      const codigo = funcionario.codigo || crypto.randomBytes(6).toString('hex');
      
      const result = await run(
        `INSERT INTO funcionarios (nome, cargo, setor, email, codigo, usuario_id, active, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          funcionario.nome,
          funcionario.cargo,
          funcionario.setor,
          funcionario.email,
          codigo,
          funcionario.usuario_id || null,
          funcionario.active !== undefined ? funcionario.active : true,
        ]
      );
      
      return { ...result, codigo };
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
      throw error;
    }
  }
  
  /**
   * Busca um funcionário pelo ID
   * @param {number} id - ID do funcionário
   * @returns {Promise<Object|null>} - Dados do funcionário
   */
  static async findById(id) {
    try {
      const funcionario = await get(
        'SELECT * FROM funcionarios WHERE id = ?',
        [id]
      );
      
      return funcionario || null;
    } catch (error) {
      console.error('Erro ao buscar funcionário por ID:', error);
      throw error;
    }
  }
  
  /**
   * Busca um funcionário pelo código
   * @param {string} codigo - Código do funcionário
   * @returns {Promise<Object|null>} - Dados do funcionário
   */
  static async findByCodigo(codigo) {
    try {
      const funcionario = await get(
        'SELECT * FROM funcionarios WHERE codigo = ?',
        [codigo]
      );
      
      return funcionario || null;
    } catch (error) {
      console.error('Erro ao buscar funcionário por código:', error);
      throw error;
    }
  }
  
  /**
   * Busca um funcionário pelo email
   * @param {string} email - Email do funcionário
   * @returns {Promise<Object|null>} - Dados do funcionário
   */
  static async findByEmail(email) {
    try {
      const funcionario = await get(
        'SELECT * FROM funcionarios WHERE email = ?',
        [email]
      );
      
      return funcionario || null;
    } catch (error) {
      console.error('Erro ao buscar funcionário por email:', error);
      throw error;
    }
  }
  
  /**
   * Busca um funcionário pelo ID do usuário
   * @param {number} usuarioId - ID do usuário
   * @returns {Promise<Object|null>} - Dados do funcionário
   */
  static async findByUsuarioId(usuarioId) {
    try {
      const funcionario = await get(
        'SELECT * FROM funcionarios WHERE usuario_id = ?',
        [usuarioId]
      );
      
      return funcionario || null;
    } catch (error) {
      console.error('Erro ao buscar funcionário por ID de usuário:', error);
      throw error;
    }
  }
  
  /**
   * Atualiza os dados de um funcionário
   * @param {number} id - ID do funcionário
   * @param {Object} dados - Dados a serem atualizados
   * @returns {Promise<void>}
   */
  static async update(id, dados) {
    try {
      const fields = [];
      const values = [];
      
      // Construir campos a serem atualizados
      if (dados.nome) {
        fields.push('nome = ?');
        values.push(dados.nome);
      }
      
      if (dados.cargo) {
        fields.push('cargo = ?');
        values.push(dados.cargo);
      }
      
      if (dados.setor) {
        fields.push('setor = ?');
        values.push(dados.setor);
      }
      
      if (dados.email) {
        fields.push('email = ?');
        values.push(dados.email);
      }
      
      if (dados.codigo) {
        fields.push('codigo = ?');
        values.push(dados.codigo);
      }
      
      if (dados.usuario_id !== undefined) {
        fields.push('usuario_id = ?');
        values.push(dados.usuario_id);
      }
      
      if (dados.active !== undefined) {
        fields.push('active = ?');
        values.push(dados.active ? 1 : 0);
      }
      
      fields.push('updated_at = datetime("now")');
      values.push(id);
      
      await run(
        `UPDATE funcionarios SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      throw error;
    }
  }
  
  /**
   * Exclui um funcionário
   * @param {number} id - ID do funcionário
   * @returns {Promise<void>}
   */
  static async delete(id) {
    try {
      await run('DELETE FROM funcionarios WHERE id = ?', [id]);
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      throw error;
    }
  }
  
  /**
   * Lista todos os funcionários
   * @param {Object} options - Opções de paginação e filtro
   * @returns {Promise<Array>} - Lista de funcionários
   */
  static async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, active, search } = options;
      const offset = (page - 1) * limit;
      
      let query = 'SELECT * FROM funcionarios WHERE 1=1';
      const params = [];
      
      // Filtrar por status (ativo/inativo)
      if (active !== undefined) {
        query += ' AND active = ?';
        params.push(active ? 1 : 0);
      }
      
      // Filtrar por termo de busca
      if (search) {
        query += ' AND (nome LIKE ? OR email LIKE ? OR cargo LIKE ? OR setor LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      query += ' ORDER BY nome ASC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const funcionarios = await all(query, params);
      
      return funcionarios;
    } catch (error) {
      console.error('Erro ao listar funcionários:', error);
      throw error;
    }
  }
  
  /**
   * Conta o total de funcionários
   * @param {Object} options - Opções de filtro
   * @returns {Promise<number>} - Total de funcionários
   */
  static async count(options = {}) {
    try {
      const { active, search } = options;
      
      let query = 'SELECT COUNT(*) as total FROM funcionarios WHERE 1=1';
      const params = [];
      
      // Filtrar por status (ativo/inativo)
      if (active !== undefined) {
        query += ' AND active = ?';
        params.push(active ? 1 : 0);
      }
      
      // Filtrar por termo de busca
      if (search) {
        query += ' AND (nome LIKE ? OR email LIKE ? OR cargo LIKE ? OR setor LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      const result = await get(query, params);
      return result.total;
    } catch (error) {
      console.error('Erro ao contar funcionários:', error);
      throw error;
    }
  }
}

module.exports = Funcionario;
