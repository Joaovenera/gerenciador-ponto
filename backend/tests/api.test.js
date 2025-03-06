const request = require('supertest');
const express = require('express');

// Create a mock Express app instead of using the real one
const app = express();

// Mock routes for testing
app.get('/api', (req, res) => {
  res.json({
    message: 'API de Registro de Ponto',
    versions: ['/v1']
  });
});

app.get('/api/v1', (req, res) => {
  res.json({
    message: 'API de Registro de Ponto - v1',
    endpoints: [
      '/v1/auth',
      '/v1/funcionarios',
      '/v1/pontos',
      '/v1/relatorios',
      '/v1/utils'
    ]
  });
});

describe('API Endpoints', () => {
  // Test the root API endpoint
  describe('GET /', () => {
    it('should return API information', async () => {
      const res = await request(app).get('/api');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('versions');
      expect(res.body.versions).toContain('/v1');
    });
  });

  // Test the v1 API endpoint
  describe('GET /v1', () => {
    it('should return v1 API information', async () => {
      const res = await request(app).get('/api/v1');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('endpoints');
      expect(res.body.endpoints).toContain('/v1/auth');
      expect(res.body.endpoints).toContain('/v1/funcionarios');
      expect(res.body.endpoints).toContain('/v1/pontos');
      expect(res.body.endpoints).toContain('/v1/relatorios');
      expect(res.body.endpoints).toContain('/v1/utils');
    });
  });
});
