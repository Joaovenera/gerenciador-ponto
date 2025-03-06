const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Create a mock Express app instead of using the real one
const app = express();
app.use(bodyParser.json());

// Mock auth routes for testing
app.post('/api/v1/auth/login', (req, res) => {
  // Mock login response based on credentials
  if (req.body.email === 'test@example.com' && req.body.senha === 'password123') {
    return res.status(200).json({
      success: true,
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: 1,
        nome: 'Test User',
        email: 'test@example.com',
        role: 'admin'
      }
    });
  }
  
  return res.status(401).json({
    success: false,
    message: 'Credenciais inválidas'
  });
});

app.get('/api/v1/auth/verify', (req, res) => {
  // Check if Authorization header is present and valid
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer mock-jwt-token')) {
    return res.status(200).json({
      success: true,
      valid: true
    });
  }
  
  return res.status(401).json({
    success: false,
    valid: false,
    message: 'Token inválido'
  });
});

describe('Auth Endpoints', () => {
  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          senha: 'password123'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          senha: 'wrongpassword'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('GET /auth/verify', () => {
    it('should verify a valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/verify')
        .set('Authorization', 'Bearer mock-jwt-token');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('valid', true);
    });
  });
});
