// services/relatorioService.js
const Ponto = require('../models/Ponto');
const Funcionario = require('../models/Funcionario');
const exportService = require('../utils/exportService');

/**
 * Gera relatório de horas trabalhadas para um funcionário
 * @param {number} funcionarioId - ID do funcionário
 * @param {Date} dataInicio - Data inicial
 * @param {Date} dataFim - Data final
 * @returns {Promise<Object>} - Relatório de horas trabalhadas
 */
exports.gerarRelatorioFuncionario = async (funcionarioId, dataInicio, dataFim) => {
  try {
    // Verificar se o funcionário existe
    const funcionario = await Funcionario.findById(funcionarioId);
    if (!funcionario) {
      throw new Error('Funcionário não encontrado');
    }
    
    // Calcular horas trabalhadas
    const relatorio = await Ponto.calcularHorasTrabalhadas(funcionarioId, dataInicio, dataFim);
    
    // Adicionar informações do funcionário
    relatorio.funcionarioInfo = {
      id: funcionario.id,
      nome: funcionario.nome,
      cargo: funcionario.cargo,
      setor: funcionario.setor
    };
    
    return relatorio;
  } catch (error) {
    console.error('Erro ao gerar relatório de funcionário:', error);
    throw error;
  }
};

/**
 * Gera relatório de horas trabalhadas para todos os funcionários
 * @param {Date} dataInicio - Data inicial
 * @param {Date} dataFim - Data final
 * @returns {Promise<Object>} - Relatório de horas trabalhadas
 */
exports.gerarRelatorioGeral = async (dataInicio, dataFim) => {
  try {
    // Buscar todos os funcionários ativos
    const funcionarios = await Funcionario.findAll({ active: true });
    
    // Inicializar relatório geral
    const relatorio = {
      periodo: {
        inicio: dataInicio.toISOString().split('T')[0],
        fim: dataFim.toISOString().split('T')[0]
      },
      funcionarios: [],
      totalHoras: 0,
      mediaDiaria: 0
    };
    
    // Calcular horas para cada funcionário
    for (const funcionario of funcionarios) {
      const relatorioFuncionario = await Ponto.calcularHorasTrabalhadas(funcionario.id, dataInicio, dataFim);
      
      relatorio.funcionarios.push({
        id: funcionario.id,
        nome: funcionario.nome,
        cargo: funcionario.cargo,
        setor: funcionario.setor,
        totalHoras: relatorioFuncionario.totalHoras,
        diasTrabalhados: relatorioFuncionario.diasTrabalhados,
        mediaDiaria: relatorioFuncionario.mediaDiaria
      });
      
      relatorio.totalHoras += relatorioFuncionario.totalHoras;
    }
    
    // Calcular média geral
    if (relatorio.funcionarios.length > 0) {
      relatorio.mediaDiaria = relatorio.totalHoras / relatorio.funcionarios.length;
    }
    
    return relatorio;
  } catch (error) {
    console.error('Erro ao gerar relatório geral:', error);
    throw error;
  }
};

/**
 * Exporta relatório para Excel
 * @param {Object} relatorio - Dados do relatório
 * @param {number} userId - ID do usuário que solicitou a exportação
 * @returns {Promise<string>} - Caminho para o arquivo gerado
 */
exports.exportarParaExcel = async (relatorio, userId) => {
  try {
    return await exportService.exportToExcel(relatorio, userId);
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    throw error;
  }
};

/**
 * Exporta relatório para PDF
 * @param {Object} relatorio - Dados do relatório
 * @param {number} userId - ID do usuário que solicitou a exportação
 * @returns {Promise<string>} - Caminho para o arquivo gerado
 */
exports.exportarParaPDF = async (relatorio, userId) => {
  try {
    return await exportService.exportToPDF(relatorio, userId);
  } catch (error) {
    console.error('Erro ao exportar para PDF:', error);
    throw error;
  }
};

/**
 * Calcula estatísticas de presença por setor
 * @param {Date} dataInicio - Data inicial
 * @param {Date} dataFim - Data final
 * @returns {Promise<Object>} - Estatísticas por setor
 */
exports.calcularEstatisticasPorSetor = async (dataInicio, dataFim) => {
  try {
    // Buscar todos os funcionários ativos
    const funcionarios = await Funcionario.findAll({ active: true });
    
    // Agrupar funcionários por setor
    const setores = {};
    
    for (const funcionario of funcionarios) {
      if (!setores[funcionario.setor]) {
        setores[funcionario.setor] = {
          nome: funcionario.setor,
          funcionarios: [],
          totalHoras: 0,
          mediaDiaria: 0,
          diasTrabalhados: 0
        };
      }
      
      setores[funcionario.setor].funcionarios.push(funcionario);
    }
    
    // Calcular estatísticas para cada setor
    for (const setor in setores) {
      let totalHorasSetor = 0;
      let totalDiasSetor = 0;
      
      for (const funcionario of setores[setor].funcionarios) {
        const relatorio = await Ponto.calcularHorasTrabalhadas(funcionario.id, dataInicio, dataFim);
        
        totalHorasSetor += relatorio.totalHoras;
        totalDiasSetor += relatorio.diasTrabalhados;
      }
      
      setores[setor].totalHoras = totalHorasSetor;
      setores[setor].diasTrabalhados = totalDiasSetor;
      
      if (setores[setor].funcionarios.length > 0) {
        setores[setor].mediaDiaria = totalHorasSetor / setores[setor].funcionarios.length;
      }
    }
    
    return {
      periodo: {
        inicio: dataInicio.toISOString().split('T')[0],
        fim: dataFim.toISOString().split('T')[0]
      },
      setores: Object.values(setores)
    };
  } catch (error) {
    console.error('Erro ao calcular estatísticas por setor:', error);
    throw error;
  }
};
