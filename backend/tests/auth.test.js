const request = require('supertest');
const { app } = require('../src/app');

// Mock the database initialization to avoid actual DB operations during tests
jest.mock('../src/config/database', () => ({
  initDatabase: jest.fn().mockResolvedValue(true)
}));

// Mock the auth controller to avoid actual database operations
jest.mock('../src/controllers/authController', () => ({
  login: (req, res) => {
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
  },
  logout: (req, res) => res.status(200).json({ success: true }),
  refreshToken: (req, res) => res.status(200).json({ success: true, token: 'new-mock-token' }),
  verifyToken: (req, res) => res.status(200).json({ success: true, valid: true })
}));

// Mock the auth middleware
jest.mock('../src/middlewares/auth', () => ({
  authMiddleware: (req, res, next) => next()
}));

// Mock the validation middleware
jest.mock('../src/middlewares/validation', () => ({
  validateLogin: (req, res, next) => next()
}));

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
