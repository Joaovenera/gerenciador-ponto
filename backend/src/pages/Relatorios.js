// src/pages/Relatorios.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const Relatorios = () => {
  const { user } = useAuth();
  const [funcionarioId, setFuncionarioId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [funcionarios, setFuncionarios] = useState([]);
  const [relatorio, setRelatorio] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Definir datas iniciais (mês atual)
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  // Carregar lista de funcionários (para admin)
  useEffect(() => {
    if (user?.role === 'admin') {
      const loadFuncionarios = async () => {
        try {
          const response = await api.get('/funcionarios');
          setFuncionarios(response.data);
        } catch (error) {
          console.error('Erro ao carregar funcionários:', error);
          setError('Não foi possível carregar a lista de funcionários.');
        }
      };
      
      loadFuncionarios();
    } else {
      // Se não for admin, carregar apenas o próprio funcionário
      const loadFuncionario = async () => {
        try {
          const response = await api.get('/funcionarios/me');
          setFuncionarioId(response.data.id);
        } catch (error) {
          console.error('Erro ao carregar dados do funcionário:', error);
          setError('Não foi possível carregar seus dados.');
        }
      };
      
      loadFuncionario();
    }
  }, [user]);

  const handleGerarRelatorio = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Construir parâmetros de consulta
      const params = new URLSearchParams();
      if (funcionarioId) {
        params.append('funcionarioId', funcionarioId);
      }
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      
      const response = await api.get(`/relatorios/horas-trabalhadas?${params}`);
      setRelatorio(response.data);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setError(error.response?.data?.message || 'Não foi possível gerar o relatório. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportar = async (formato) => {
    try {
      // Construir parâmetros de consulta
      const params = new URLSearchParams();
      if (funcionarioId) {
        params.append('funcionarioId', funcionarioId);
      }
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      
      // Fazer download do arquivo
      const endpoint = formato === 'excel' 
        ? '/relatorios/export/excel' 
        : '/relatorios/export/pdf';
      
      window.open(`${api.defaults.baseURL}${endpoint}?${params}`, '_blank');
    } catch (error) {
      console.error(`Erro ao exportar para ${formato}:`, error);
      setError(`Não foi possível exportar para ${formato}. Tente novamente.`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Relatórios</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold mb-4">Filtros</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {user?.role === 'admin' && (
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Funcionário
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                value={funcionarioId}
                onChange={(e) => setFuncionarioId(e.target.value)}
              >
                <option value="">Todos os funcionários</option>
                {funcionarios.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome} - {f.cargo}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Data Inicial
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-lg"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Data Final
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-lg"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleGerarRelatorio}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
              disabled={isLoading || (!startDate || !endDate)}
            >
              {isLoading ? 'Gerando...' : 'Gerar Relatório'}
            </button>
          </div>
        </div>
        
        {relatorio && (
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => handleExportar('excel')}
              className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600"
            >
              Exportar Excel
            </button>
            
            <button
              onClick={() => handleExportar('pdf')}
              className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600"
            >
              Exportar PDF
            </button>
          </div>
        )}
      </div>
      
      {relatorio && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Resultado</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Total de Horas</h3>
              <p className="text-3xl">{relatorio.totalHoras.toFixed(2)}h</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Dias Trabalhados</h3>
              <p className="text-3xl">{relatorio.diasTrabalhados}</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">Média Diária</h3>
              <p className="text-3xl">{relatorio.mediaDiaria.toFixed(2)}h</p>
            </div>
          </div>
          
          <h3 className="text-lg font-bold mb-2">Detalhamento por Dia</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">Data</th>
                  <th className="py-2 px-4 border-b text-left">Entrada</th>
                  <th className="py-2 px-4 border-b text-left">Saída</th>
                  <th className="py-2 px-4 border-b text-left">Total de Horas</th>
                  <th className="py-2 px-4 border-b text-left">Observações</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.registrosPorDia.map((registro) => (
                  <tr key={registro.data}>
                    <td className="py-2 px-4 border-b">
                      {new Date(registro.data).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {registro.entrada ? new Date(registro.entrada).toLocaleTimeString() : '-'}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {registro.saida ? new Date(registro.saida).toLocaleTimeString() : '-'}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {registro.totalHoras ? `${registro.totalHoras.toFixed(2)}h` : '-'}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {registro.incompleto && (
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                          Registro incompleto
                        </span>
                      )}
                      {registro.corrigido && (
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 ml-1">
                          Contém correções
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Relatorios;