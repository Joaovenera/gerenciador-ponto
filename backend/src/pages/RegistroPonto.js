import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const RegistroPonto = () => {
  const { user } = useAuth();
  const [funcionarioId, setFuncionarioId] = useState('');
  const [tipo, setTipo] = useState('entrada');
  const [observacao, setObservacao] = useState('');
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '' });
  const [funcionarios, setFuncionarios] = useState([]);
  const [ultimosRegistros, setUltimosRegistros] = useState([]);

  // Obter localização atual
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setStatus({
            message: 'Não foi possível obter sua localização atual. Verifique as permissões.',
            type: 'error',
          });
        }
      );
    } else {
      setStatus({
        message: 'Seu navegador não suporta geolocalização.',
        type: 'error',
      });
    }
  }, []);

  // Carregar funcionários se o usuário for admin
  useEffect(() => {
    if (user?.role === 'admin') {
      const loadFuncionarios = async () => {
        try {
          const response = await api.get('/funcionarios');
          setFuncionarios(response.data);
        } catch (error) {
          console.error('Erro ao carregar funcionários:', error);
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
        }
      };
      
      loadFuncionario();
    }
  }, [user]);

  // Carregar últimos registros
  useEffect(() => {
    if (funcionarioId) {
      const loadRegistros = async () => {
        try {
          const response = await api.get(`/pontos/funcionario/${funcionarioId}?limit=5`);
          setUltimosRegistros(response.data.pontos);
        } catch (error) {
          console.error('Erro ao carregar últimos registros:', error);
        }
      };
      
      loadRegistros();
    }
  }, [funcionarioId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ message: '', type: '' });

    try {
      const payload = {
        funcionario_id: funcionarioId,
        tipo,
        observacao: observacao || null,
        latitude: location?.latitude,
        longitude: location?.longitude,
      };

      await api.post('/pontos', payload);
      
      setStatus({
        message: `Ponto de ${tipo === 'entrada' ? 'entrada' : 'saída'} registrado com sucesso!`,
        type: 'success',
      });
      
      // Alternar tipo após registro bem-sucedido
      setTipo(tipo === 'entrada' ? 'saida' : 'entrada');
      setObservacao('');
      
      // Recarregar últimos registros
      const response = await api.get(`/pontos/funcionario/${funcionarioId}?limit=5`);
      setUltimosRegistros(response.data.pontos);
    } catch (error) {
      setStatus({
        message: error.response?.data?.message || 'Erro ao registrar ponto. Tente novamente.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Registro de Ponto</h1>
      
      {status.message && (
        <div 
          className={`p-4 mb-6 rounded-lg ${
            status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {status.message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
        {user?.role === 'admin' && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Funcionário
            </label>
            <select
              className="w-full px-3 py-2 border rounded-lg"
              value={funcionarioId}
              onChange={(e) => setFuncionarioId(e.target.value)}
              required
            >
              <option value="">Selecione um funcionário</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome} - {f.cargo}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Tipo de Registro
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="entrada"
                checked={tipo === 'entrada'}
                onChange={() => setTipo('entrada')}
                className="form-radio"
              />
              <span className="ml-2">Entrada</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="saida"
                checked={tipo === 'saida'}
                onChange={() => setTipo('saida')}
                className="form-radio"
              />
              <span className="ml-2">Saída</span>
            </label>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Observação (opcional)
          </label>
          <textarea
            className="w-full px-3 py-2 border rounded-lg"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows="3"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Localização
          </label>
          {location ? (
            <div className="text-sm text-gray-600">
              <p>Latitude: {location.latitude}</p>
              <p>Longitude: {location.longitude}</p>
            </div>
          ) : (
            <p className="text-sm text-yellow-600">
              Obtendo sua localização... Por favor, permita o acesso à sua localização.
            </p>
          )}
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          disabled={isLoading || !location || !funcionarioId}
        >
          {isLoading ? 'Registrando...' : `Registrar ${tipo === 'entrada' ? 'Entrada' : 'Saída'}`}
        </button>
      </form>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Últimos Registros</h2>
        
        {ultimosRegistros.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">Data/Hora</th>
                  <th className="py-2 px-4 border-b text-left">Tipo</th>
                  <th className="py-2 px-4 border-b text-left">Observação</th>
                  <th className="py-2 px-4 border-b text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {ultimosRegistros.map((registro) => (
                  <tr key={registro.id}>
                    <td className="py-2 px-4 border-b">
                      {new Date(registro.data_hora).toLocaleString()}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        registro.tipo === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {registro.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      {registro.observacao || '-'}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {registro.corrigido ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                          Corrigido
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          Original
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">Nenhum registro encontrado.</p>
        )}
      </div>
    </div>
  );
};

export default RegistroPonto;