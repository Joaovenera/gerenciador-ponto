// controllers/relatorioController.js
const Ponto = require('../models/Ponto');
const Funcionario = require('../models/Funcionario');
const exportService = require('../utils/exportService');

/**
 * Calcula horas trabalhadas por funcionário em um período
 * @route GET /relatorios/horas-trabalhadas
 * @access Autenticado
 */
exports.calcularHorasTrabalhadas = async (req, res) => {
  try {
    const { funcionario_id } = req.query;
    const dataInicio = req.query.data_inicio ? new Date(req.query.data_inicio) : new Date(new Date().setDate(new Date().getDate() - 30));
    const dataFim = req.query.data_fim ? new Date(req.query.data_fim) : new Date();
    
    // Validar datas
    if (dataInicio > dataFim) {
      return res.status(400).json({ message: 'Data inicial deve ser anterior à data final' });
    }
    
    // Verificar permissões
    const isAdmin = req.user.role === 'admin';
    
    // Se não for admin e estiver tentando acessar relatório de outro funcionário
    if (!isAdmin && funcionario_id) {
      const funcionario = await Funcionario.findById(funcionario_id);
      if (!funcionario || funcionario.usuario_id !== req.user.id) {
        return res.status(403).json({ message: 'Sem permissão para acessar este relatório' });
      }
    }
    
    // Se não for admin e não especificou funcionário, buscar o próprio funcionário
    let funcionarioIdFinal = funcionario_id;
    if (!isAdmin && !funcionario_id) {
      const funcionario = await Funcionario.findByUsuarioId(req.user.id);
      if (!funcionario) {
        return res.status(404).json({ message: 'Funcionário não encontrado para este usuário' });
      }
      funcionarioIdFinal = funcionario.id;
    }
    
    // Calcular horas trabalhadas
    let relatorio;
    
    if (funcionarioIdFinal) {
      // Relatório para um funcionário específico
      relatorio = await Ponto.calcularHorasTrabalhadas(funcionarioIdFinal, dataInicio, dataFim);
      
      // Adicionar informações do funcionário
      const funcionario = await Funcionario.findById(funcionarioIdFinal);
      relatorio.funcionarioInfo = {
        id: funcionario.id,
        nome: funcionario.nome,
        cargo: funcionario.cargo,
        setor: funcionario.setor
      };
    } else if (isAdmin) {
      // Relatório para todos os funcionários (apenas admin)
      const funcionarios = await Funcionario.findAll({ active: true });
      
      // Inicializar relatório geral
      relatorio = {
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
    } else {
      return res.status(400).json({ message: 'Parâmetros inválidos' });
    }
    
    return res.json(relatorio);
  } catch (error) {
    console.error('Erro ao calcular horas trabalhadas:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Exporta relatório para Excel
 * @route GET /relatorios/export/excel
 * @access Autenticado
 */
exports.exportToExcel = async (req, res) => {
  try {
    const { funcionario_id } = req.query;
    const dataInicio = req.query.data_inicio ? new Date(req.query.data_inicio) : new Date(new Date().setDate(new Date().getDate() - 30));
    const dataFim = req.query.data_fim ? new Date(req.query.data_fim) : new Date();
    
    // Validar datas
    if (dataInicio > dataFim) {
      return res.status(400).json({ message: 'Data inicial deve ser anterior à data final' });
    }
    
    // Verificar permissões
    const isAdmin = req.user.role === 'admin';
    
    // Se não for admin e estiver tentando acessar relatório de outro funcionário
    if (!isAdmin && funcionario_id) {
      const funcionario = await Funcionario.findById(funcionario_id);
      if (!funcionario || funcionario.usuario_id !== req.user.id) {
        return res.status(403).json({ message: 'Sem permissão para acessar este relatório' });
      }
    }
    
    // Se não for admin e não especificou funcionário, buscar o próprio funcionário
    let funcionarioIdFinal = funcionario_id;
    if (!isAdmin && !funcionario_id) {
      const funcionario = await Funcionario.findByUsuarioId(req.user.id);
      if (!funcionario) {
        return res.status(404).json({ message: 'Funcionário não encontrado para este usuário' });
      }
      funcionarioIdFinal = funcionario.id;
    }
    
    // Calcular horas trabalhadas
    let relatorio;
    
    if (funcionarioIdFinal) {
      // Relatório para um funcionário específico
      relatorio = await Ponto.calcularHorasTrabalhadas(funcionarioIdFinal, dataInicio, dataFim);
      
      // Adicionar informações do funcionário
      const funcionario = await Funcionario.findById(funcionarioIdFinal);
      relatorio.funcionarioInfo = {
        id: funcionario.id,
        nome: funcionario.nome,
        cargo: funcionario.cargo,
        setor: funcionario.setor
      };
    } else if (isAdmin) {
      // Relatório para todos os funcionários (apenas admin)
      const funcionarios = await Funcionario.findAll({ active: true });
      
      // Inicializar relatório geral
      relatorio = {
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
    } else {
      return res.status(400).json({ message: 'Parâmetros inválidos' });
    }
    
    // Exportar para Excel
    const filePath = await exportService.exportToExcel(relatorio, req.user.id);
    
    // Enviar arquivo
    return res.download(filePath);
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Exporta relatório para PDF
 * @route GET /relatorios/export/pdf
 * @access Autenticado
 */
exports.exportToPDF = async (req, res) => {
  try {
    const { funcionario_id } = req.query;
    const dataInicio = req.query.data_inicio ? new Date(req.query.data_inicio) : new Date(new Date().setDate(new Date().getDate() - 30));
    const dataFim = req.query.data_fim ? new Date(req.query.data_fim) : new Date();
    
    // Validar datas
    if (dataInicio > dataFim) {
      return res.status(400).json({ message: 'Data inicial deve ser anterior à data final' });
    }
    
    // Verificar permissões
    const isAdmin = req.user.role === 'admin';
    
    // Se não for admin e estiver tentando acessar relatório de outro funcionário
    if (!isAdmin && funcionario_id) {
      const funcionario = await Funcionario.findById(funcionario_id);
      if (!funcionario || funcionario.usuario_id !== req.user.id) {
        return res.status(403).json({ message: 'Sem permissão para acessar este relatório' });
      }
    }
    
    // Se não for admin e não especificou funcionário, buscar o próprio funcionário
    let funcionarioIdFinal = funcionario_id;
    if (!isAdmin && !funcionario_id) {
      const funcionario = await Funcionario.findByUsuarioId(req.user.id);
      if (!funcionario) {
        return res.status(404).json({ message: 'Funcionário não encontrado para este usuário' });
      }
      funcionarioIdFinal = funcionario.id;
    }
    
    // Calcular horas trabalhadas
    let relatorio;
    
    if (funcionarioIdFinal) {
      // Relatório para um funcionário específico
      relatorio = await Ponto.calcularHorasTrabalhadas(funcionarioIdFinal, dataInicio, dataFim);
      
      // Adicionar informações do funcionário
      const funcionario = await Funcionario.findById(funcionarioIdFinal);
      relatorio.funcionarioInfo = {
        id: funcionario.id,
        nome: funcionario.nome,
        cargo: funcionario.cargo,
        setor: funcionario.setor
      };
    } else if (isAdmin) {
      // Relatório para todos os funcionários (apenas admin)
      const funcionarios = await Funcionario.findAll({ active: true });
      
      // Inicializar relatório geral
      relatorio = {
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
    } else {
      return res.status(400).json({ message: 'Parâmetros inválidos' });
    }
    
    // Exportar para PDF
    const filePath = await exportService.exportToPDF(relatorio, req.user.id);
    
    // Enviar arquivo
    return res.download(filePath);
  } catch (error) {
    console.error('Erro ao exportar para PDF:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
