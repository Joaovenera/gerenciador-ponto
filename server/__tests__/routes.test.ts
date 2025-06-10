import express, { Express } from 'express';
import request from 'supertest';
import { Server } from 'http';
import { registerRoutes } from '../routes';

describe('API Routes', () => {
  let app: Express;
  let server: Server;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    server = await registerRoutes(app);
  });

  afterAll((done) => {
    if (server && server.listening) {
      server.close(done);
    } else {
      done();
    }
  });

  describe('Authentication', () => {
    it('GET /api/user should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/user');
      expect(response.status).toBe(401);
    });

    it('POST /api/login should reject invalid credentials', async () => {
      const credentials = {
        username: 'nonexistent@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/login')
        .send(credentials);
        
      expect(response.status).toBe(401);
    });
  });
});
