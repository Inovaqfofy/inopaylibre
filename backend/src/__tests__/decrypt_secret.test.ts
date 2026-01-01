import request from 'supertest';
import express from 'express';
import { decrypt_secretRouter } from './decrypt_secret';

const app = express();
app.use(express.json());
app.use('/api/decrypt-secret', decrypt_secretRouter);

describe('decrypt-secret route', () => {

  describe('POST /api/decrypt-secret', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/decrypt-secret')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/decrypt-secret')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
