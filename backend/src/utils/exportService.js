// utils/exportService.js
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Funcionario = require('../models/Funcionario');

// Garantir que o diretório de exportação existe
const exportsDir = path.join(__dirname, '../../temp/exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

/**
 * Exporta relatório para Excel
 * @param {Object} relatorio - Dados do relatório
 * @param {string} userId - ID do usuário que solicitou a exportação
 * @returns {Promise<string>} - Caminho para o arquivo gerado
 */
exports.exportToExcel = async (relatorio, userId) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatório de Horas');
    
    // Adicionar cabeçalho com informações do relatório
    worksheet.addRow(['Relatório de Horas Trabalhadas']);
    worksheet.addRow(['Período:', `${relatorio.periodo.inicio} a ${relatorio.periodo.fim}`]);
    
    if (relatorio.funcionarioInfo) {
      // Relatório de um funcionário específico
      worksheet.addRow(['Funcionário:', relatorio.funcionarioInfo.nome]);
      worksheet.addRow(['Cargo:', relatorio.funcionarioInfo.cargo]);
      worksheet.addRow(['Setor:', relatorio.funcionarioInfo.setor]);
      
      worksheet.addRow([]);
      worksheet.addRow(['Resumo']);
      worksheet.addRow(['Total de Horas:', relatorio.totalHoras.toFixed(2)]);
      worksheet.addRow(['Dias Trabalhados:', relatorio.diasTrabalhados]);
      worksheet.addRow(['Média Diária:', relatorio.mediaDiaria.toFixed(2)]);
      
      worksheet.addRow([]);
      worksheet.addRow(['Detalhamento por Dia']);
      
      // Cabeçalho da tabela
      const headers = ['Data', 'Entrada', 'Saída', 'Total de Horas', 'Observações'];
      worksheet.addRow(headers);
      
      // Estilo para cabeçalho
      worksheet.getRow(worksheet.rowCount).eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' }
        };
      });
      
      // Adicionar dados da tabela
      relatorio.registrosPorDia.forEach((registro) => {
        const data = registro.data;
        const entrada = registro.entrada ? new Date(registro.entrada).toLocaleTimeString() : '-';
        const saida = registro.saida ? new Date(registro.saida).toLocaleTimeString() : '-';
        const totalHoras = registro.totalHoras ? registro.totalHoras.toFixed(2) : '-';
        
        let observacoes = '';
        if (registro.incompleto) observacoes += 'Registro incompleto; ';
        if (registro.corrigido) observacoes += 'Contém correções; ';
        
        worksheet.addRow([data, entrada, saida, totalHoras, observacoes]);
      });
    } else if (relatorio.funcionarios) {
      // Relatório de todos os funcionários
      worksheet.addRow(['Funcionários:', 'Todos']);
      
      worksheet.addRow([]);
      worksheet.addRow(['Resumo Geral']);
      worksheet.addRow(['Total de Funcionários:', relatorio.funcionarios.length]);
      worksheet.addRow(['Total de Horas:', relatorio.totalHoras.toFixed(2)]);
      worksheet.addRow(['Média Diária:', relatorio.mediaDiaria.toFixed(2)]);
      
      worksheet.addRow([]);
      worksheet.addRow(['Detalhamento por Funcionário']);
      
      // Cabeçalho da tabela
      const headers = ['Nome', 'Cargo', 'Setor', 'Total de Horas', 'Dias Trabalhados', 'Média Diária'];
      worksheet.addRow(headers);
      
      // Estilo para cabeçalho
      worksheet.getRow(worksheet.rowCount).eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' }
        };
      });
      
      // Adicionar dados da tabela
      relatorio.funcionarios.forEach((funcionario) => {
        worksheet.addRow([
          funcionario.nome,
          funcionario.cargo,
          funcionario.setor,
          funcionario.totalHoras.toFixed(2),
          funcionario.diasTrabalhados,
          funcionario.mediaDiaria.toFixed(2)
        ]);
      });
    }
    
    // Ajustar largura das colunas
    worksheet.columns.forEach((column) => {
      const lengths = column.values.map(v => v?.toString().length || 0);
      const maxLength = Math.max(...lengths);
      column.width = maxLength + 2;
    });
    
    // Definir caminho do arquivo
    const fileName = `relatorio_${Date.now()}_${userId}.xlsx`;
    const filePath = path.join(exportsDir, fileName);
    
    // Salvar arquivo
    await workbook.xlsx.writeFile(filePath);
    
    return filePath;
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    throw new Error('Não foi possível exportar para Excel');
  }
};

/**
 * Exporta relatório para PDF
 * @param {Object} relatorio - Dados do relatório
 * @param {string} userId - ID do usuário que solicitou a exportação
 * @returns {Promise<string>} - Caminho para o arquivo gerado
 */
exports.exportToPDF = async (relatorio, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Definir caminho do arquivo
      const fileName = `relatorio_${Date.now()}_${userId}.pdf`;
      const filePath = path.join(exportsDir, fileName);
      
      // Criar documento PDF
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      
      // Configurar evento de conclusão
      stream.on('finish', () => {
        resolve(filePath);
      });
      
      // Configurar fluxo de documento
      doc.pipe(stream);
      
      // Título do relatório
      doc.fontSize(20).text('Relatório de Horas Trabalhadas', { align: 'center' });
      doc.moveDown();
      
      // Informações do período
      doc.fontSize(12).text(`Período: ${relatorio.periodo.inicio} a ${relatorio.periodo.fim}`);
      doc.moveDown();
      
      if (relatorio.funcionarioInfo) {
        // Relatório de um funcionário específico
        doc.text(`Funcionário: ${relatorio.funcionarioInfo.nome}`);
        doc.text(`Cargo: ${relatorio.funcionarioInfo.cargo}`);
        doc.text(`Setor: ${relatorio.funcionarioInfo.setor}`);
        doc.moveDown();
        
        // Resumo
        doc.fontSize(16).text('Resumo', { underline: true });
        doc.fontSize(12);
        doc.text(`Total de Horas: ${relatorio.totalHoras.toFixed(2)}`);
        doc.text(`Dias Trabalhados: ${relatorio.diasTrabalhados}`);
        doc.text(`Média Diária: ${relatorio.mediaDiaria.toFixed(2)}`);
        doc.moveDown();
        
        // Detalhamento por dia
        doc.fontSize(16).text('Detalhamento por Dia', { underline: true });
        doc.fontSize(12);
        doc.moveDown();
        
        // Tabela de registros
        const tableTop = doc.y;
        const tableLeft = 50;
        const colWidths = [80, 80, 80, 80, 150];
        
        // Cabeçalho da tabela
        doc.font('Helvetica-Bold');
        doc.text('Data', tableLeft, tableTop);
        doc.text('Entrada', tableLeft + colWidths[0], tableTop);
        doc.text('Saída', tableLeft + colWidths[0] + colWidths[1], tableTop);
        doc.text('Total Horas', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
        doc.text('Observações', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop);
        doc.font('Helvetica');
        
        // Linhas da tabela
        let rowTop = tableTop + 20;
        
        relatorio.registrosPorDia.forEach((registro) => {
          // Verificar se precisa de nova página
          if (rowTop > doc.page.height - 100) {
            doc.addPage();
            rowTop = 50;
          }
          
          const data = registro.data;
          const entrada = registro.entrada ? new Date(registro.entrada).toLocaleTimeString() : '-';
          const saida = registro.saida ? new Date(registro.saida).toLocaleTimeString() : '-';
          const totalHoras = registro.totalHoras ? registro.totalHoras.toFixed(2) : '-';
          
          let observacoes = '';
          if (registro.incompleto) observacoes += 'Registro incompleto; ';
          if (registro.corrigido) observacoes += 'Contém correções; ';
          
          doc.text(data, tableLeft, rowTop);
          doc.text(entrada, tableLeft + colWidths[0], rowTop);
          doc.text(saida, tableLeft + colWidths[0] + colWidths[1], rowTop);
          doc.text(totalHoras, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], rowTop);
          doc.text(observacoes, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], rowTop);
          
          rowTop += 20;
        });
      } else if (relatorio.funcionarios) {
        // Relatório de todos os funcionários
        doc.text('Funcionários: Todos');
        doc.moveDown();
        
        // Resumo geral
        doc.fontSize(16).text('Resumo Geral', { underline: true });
        doc.fontSize(12);
        doc.text(`Total de Funcionários: ${relatorio.funcionarios.length}`);
        doc.text(`Total de Horas: ${relatorio.totalHoras.toFixed(2)}`);
        doc.text(`Média Diária: ${relatorio.mediaDiaria.toFixed(2)}`);
        doc.moveDown();
        
        // Detalhamento por funcionário
        doc.fontSize(16).text('Detalhamento por Funcionário', { underline: true });
        doc.fontSize(12);
        doc.moveDown();
        
        // Tabela de funcionários
        const tableTop = doc.y;
        const tableLeft = 50;
        const colWidths = [120, 80, 80, 80, 80, 80];
        
        // Cabeçalho da tabela
        doc.font('Helvetica-Bold');
        doc.text('Nome', tableLeft, tableTop);
        doc.text('Cargo', tableLeft + colWidths[0], tableTop);
        doc.text('Setor', tableLeft + colWidths[0] + colWidths[1], tableTop);
        doc.text('Total Horas', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
        doc.text('Dias Trab.', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop);
        doc.text('Média Diária', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], tableTop);
        doc.font('Helvetica');
        
        // Linhas da tabela
        let rowTop = tableTop + 20;
        
        relatorio.funcionarios.forEach((funcionario) => {
          // Verificar se precisa de nova página
          if (rowTop > doc.page.height - 100) {
            doc.addPage();
            rowTop = 50;
          }
          
          doc.text(funcionario.nome, tableLeft, rowTop);
          doc.text(funcionario.cargo, tableLeft + colWidths[0], rowTop);
          doc.text(funcionario.setor, tableLeft + colWidths[0] + colWidths[1], rowTop);
          doc.text(funcionario.totalHoras.toFixed(2), tableLeft + colWidths[0] + colWidths[1] + colWidths[2], rowTop);
          doc.text(funcionario.diasTrabalhados.toString(), tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], rowTop);
          doc.text(funcionario.mediaDiaria.toFixed(2), tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], rowTop);
          
          rowTop += 20;
        });
      }
      
      // Rodapé
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        
        // Data de geração
        const dataGeracao = new Date().toLocaleString();
        doc.fontSize(8).text(
          `Gerado em: ${dataGeracao}`,
          50,
          doc.page.height - 50,
          { align: 'left' }
        );
        
        // Numeração de página
        doc.text(
          `Página ${i + 1} de ${pageCount}`,
          doc.page.width - 50,
          doc.page.height - 50,
          { align: 'right' }
        );
      }
      
      // Finalizar documento
      doc.end();
    } catch (error) {
      console.error('Erro ao exportar para PDF:', error);
      reject(new Error('Não foi possível exportar para PDF'));
    }
  });
};

/**
 * Limpa arquivos temporários de exportação
 * Remove arquivos com mais de 24 horas
 */
exports.cleanupExportFiles = () => {
  try {
    const files = fs.readdirSync(exportsDir);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    files.forEach(file => {
      const filePath = path.join(exportsDir, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs;
      
      if (fileAge > oneDayMs) {
        fs.unlinkSync(filePath);
        console.log(`Arquivo de exportação removido: ${file}`);
      }
    });
  } catch (error) {
    console.error('Erro ao limpar arquivos de exportação:', error);
  }
};

// Configurar limpeza periódica de arquivos (a cada 12 horas)
setInterval(exports.cleanupExportFiles, 12 * 60 * 60 * 1000);
