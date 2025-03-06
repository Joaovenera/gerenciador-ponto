// models/Ponto.js
const { db, run, get, all } = require('../config/database');

class Ponto {
  /**
   * Cria um novo registro de ponto
   * @param {Object} ponto - Dados do registro de ponto
   * @returns {Promise<Object>} - ID do registro criado
   */
  static async create(ponto) {
    try {
      const result = await run(
        `INSERT INTO pontos (
          funcionario_id, tipo, data_hora, latitude, longitude, 
          ip, observacao, corrigido, corrigido_por, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          ponto.funcionario_id,
          ponto.tipo,
          ponto.data_hora.toISOString(),
          ponto.latitude || null,
          ponto.longitude || null,
          ponto.ip || null,
          ponto.observacao || null,
          ponto.corrigido || false,
          ponto.corrigido_por || null
        ]
      );
      
      return result;
    } catch (error) {
      console.error('Erro ao criar registro de ponto:', error);
      throw error;
    }
  }
  
  /**
   * Busca um registro de ponto pelo ID
   * @param {number} id - ID do registro
   * @returns {Promise<Object|null>} - Dados do registro
   */
  static async findById(id) {
    try {
      const ponto = await get(
        'SELECT * FROM pontos WHERE id = ?',
        [id]
      );
      
      return ponto || null;
    } catch (error) {
      console.error('Erro ao buscar registro de ponto por ID:', error);
      throw error;
    }
  }
  
  /**
   * Atualiza um registro de ponto
   * @param {number} id - ID do registro
   * @param {Object} dados - Dados a serem atualizados
   * @returns {Promise<void>}
   */
  static async update(id, dados) {
    try {
      const fields = [];
      const values = [];
      
      // Construir campos a serem atualizados
      if (dados.funcionario_id) {
        fields.push('funcionario_id = ?');
        values.push(dados.funcionario_id);
      }
      
      if (dados.tipo) {
        fields.push('tipo = ?');
        values.push(dados.tipo);
      }
      
      if (dados.data_hora) {
        fields.push('data_hora = ?');
        values.push(dados.data_hora.toISOString());
      }
      
      if (dados.latitude !== undefined) {
        fields.push('latitude = ?');
        values.push(dados.latitude);
      }
      
      if (dados.longitude !== undefined) {
        fields.push('longitude = ?');
        values.push(dados.longitude);
      }
      
      if (dados.ip !== undefined) {
        fields.push('ip = ?');
        values.push(dados.ip);
      }
      
      if (dados.observacao !== undefined) {
        fields.push('observacao = ?');
        values.push(dados.observacao);
      }
      
      if (dados.corrigido !== undefined) {
        fields.push('corrigido = ?');
        values.push(dados.corrigido ? 1 : 0);
      }
      
      if (dados.corrigido_por !== undefined) {
        fields.push('corrigido_por = ?');
        values.push(dados.corrigido_por);
      }
      
      fields.push('updated_at = datetime("now")');
      values.push(id);
      
      await run(
        `UPDATE pontos SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    } catch (error) {
      console.error('Erro ao atualizar registro de ponto:', error);
      throw error;
    }
  }
  
  /**
   * Exclui um registro de ponto
   * @param {number} id - ID do registro
   * @returns {Promise<void>}
   */
  static async delete(id) {
    try {
      await run('DELETE FROM pontos WHERE id = ?', [id]);
    } catch (error) {
      console.error('Erro ao excluir registro de ponto:', error);
      throw error;
    }
  }
  
  /**
   * Lista todos os registros de ponto
   * @param {Object} options - Opções de paginação e filtro
   * @returns {Promise<Array>} - Lista de registros
   */
  static async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, startDate, endDate } = options;
      const offset = (page - 1) * limit;
      
      let query = 'SELECT * FROM pontos WHERE 1=1';
      const params = [];
      
      // Filtrar por período
      if (startDate) {
        query += ' AND data_hora >= ?';
        params.push(startDate.toISOString());
      }
      
      if (endDate) {
        query += ' AND data_hora <= ?';
        params.push(endDate.toISOString());
      }
      
      query += ' ORDER BY data_hora DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const pontos = await all(query, params);
      
      return pontos;
    } catch (error) {
      console.error('Erro ao listar registros de ponto:', error);
      throw error;
    }
  }
  
  /**
   * Lista registros de ponto de um funcionário específico
   * @param {number} funcionarioId - ID do funcionário
   * @param {Object} options - Opções de paginação e filtro
   * @returns {Promise<Array>} - Lista de registros
   */
  static async findByFuncionario(funcionarioId, options = {}) {
    try {
      const { page = 1, limit = 10, startDate, endDate } = options;
      const offset = (page - 1) * limit;
      
      let query = 'SELECT * FROM pontos WHERE funcionario_id = ?';
      const params = [funcionarioId];
      
      // Filtrar por período
      if (startDate) {
        query += ' AND data_hora >= ?';
        params.push(startDate.toISOString());
      }
      
      if (endDate) {
        query += ' AND data_hora <= ?';
        params.push(endDate.toISOString());
      }
      
      query += ' ORDER BY data_hora DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const pontos = await all(query, params);
      
      return pontos;
    } catch (error) {
      console.error('Erro ao listar registros de ponto do funcionário:', error);
      throw error;
    }
  }
  
  /**
   * Conta o total de registros de ponto
   * @param {Object} options - Opções de filtro
   * @returns {Promise<number>} - Total de registros
   */
  static async count(options = {}) {
    try {
      const { startDate, endDate } = options;
      
      let query = 'SELECT COUNT(*) as total FROM pontos WHERE 1=1';
      const params = [];
      
      // Filtrar por período
      if (startDate) {
        query += ' AND data_hora >= ?';
        params.push(startDate.toISOString());
      }
      
      if (endDate) {
        query += ' AND data_hora <= ?';
        params.push(endDate.toISOString());
      }
      
      const result = await get(query, params);
      return result.total;
    } catch (error) {
      console.error('Erro ao contar registros de ponto:', error);
      throw error;
    }
  }
  
  /**
   * Conta o total de registros de ponto de um funcionário
   * @param {number} funcionarioId - ID do funcionário
   * @param {Object} options - Opções de filtro
   * @returns {Promise<number>} - Total de registros
   */
  static async countByFuncionario(funcionarioId, options = {}) {
    try {
      const { startDate, endDate } = options;
      
      let query = 'SELECT COUNT(*) as total FROM pontos WHERE funcionario_id = ?';
      const params = [funcionarioId];
      
      // Filtrar por período
      if (startDate) {
        query += ' AND data_hora >= ?';
        params.push(startDate.toISOString());
      }
      
      if (endDate) {
        query += ' AND data_hora <= ?';
        params.push(endDate.toISOString());
      }
      
      const result = await get(query, params);
      return result.total;
    } catch (error) {
      console.error('Erro ao contar registros de ponto do funcionário:', error);
      throw error;
    }
  }
  
  /**
   * Calcula horas trabalhadas por funcionário em um período
   * @param {number} funcionarioId - ID do funcionário
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {Promise<Object>} - Relatório de horas trabalhadas
   */
  static async calcularHorasTrabalhadas(funcionarioId, startDate, endDate) {
    try {
      // Buscar todos os registros no período
      let query = `
        SELECT * FROM pontos 
        WHERE funcionario_id = ? 
        AND data_hora >= ? 
        AND data_hora <= ? 
        ORDER BY data_hora ASC
      `;
      
      const pontos = await all(query, [
        funcionarioId,
        startDate.toISOString(),
        endDate.toISOString()
      ]);
      
      // Agrupar registros por dia
      const registrosPorDia = {};
      let totalHoras = 0;
      let diasTrabalhados = 0;
      
      pontos.forEach(ponto => {
        const data = new Date(ponto.data_hora).toISOString().split('T')[0];
        
        if (!registrosPorDia[data]) {
          registrosPorDia[data] = {
            data,
            registros: []
          };
        }
        
        registrosPorDia[data].registros.push(ponto);
      });
      
      // Calcular horas por dia
      const relatorio = {
        funcionario: funcionarioId,
        periodo: {
          inicio: startDate.toISOString().split('T')[0],
          fim: endDate.toISOString().split('T')[0]
        },
        registrosPorDia: []
      };
      
      for (const data in registrosPorDia) {
        const registrosDia = registrosPorDia[data].registros;
        let entrada = null;
        let saida = null;
        let totalHorasDia = 0;
        let incompleto = false;
        let corrigido = false;
        
        // Verificar se há registros de entrada e saída
        for (let i = 0; i < registrosDia.length; i++) {
          const registro = registrosDia[i];
          
          if (registro.tipo === 'entrada' && !entrada) {
            entrada = registro.data_hora;
          } else if (registro.tipo === 'saida' && entrada && !saida) {
            saida = registro.data_hora;
            
            // Calcular horas entre entrada e saída
            const horasEntrada = new Date(entrada);
            const horasSaida = new Date(saida);
            const diff = (horasSaida - horasEntrada) / (1000 * 60 * 60);
            
            totalHorasDia += diff;
            entrada = null;
            saida = null;
          }
          
          if (registro.corrigido) {
            corrigido = true;
          }
        }
        
        // Verificar se há registros incompletos
        if (entrada && !saida) {
          incompleto = true;
        }
        
        // Adicionar ao relatório
        relatorio.registrosPorDia.push({
          data,
          entrada: registrosDia.find(r => r.tipo === 'entrada')?.data_hora || null,
          saida: registrosDia.find(r => r.tipo === 'saida')?.data_hora || null,
          totalHoras: totalHorasDia,
          incompleto,
          corrigido
        });
        
        if (totalHorasDia > 0) {
          totalHoras += totalHorasDia;
          diasTrabalhados++;
        }
      }
      
      // Adicionar totais ao relatório
      relatorio.totalHoras = totalHoras;
      relatorio.diasTrabalhados = diasTrabalhados;
      relatorio.mediaDiaria = diasTrabalhados > 0 ? totalHoras / diasTrabalhados : 0;
      
      return relatorio;
    } catch (error) {
      console.error('Erro ao calcular horas trabalhadas:', error);
      throw error;
    }
  }
}

module.exports = Ponto;
