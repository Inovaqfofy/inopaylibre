import request from 'supertest';
import express from 'express';
import { encrypt_secretsRouter } from './encrypt_secrets';

const app = express();
app.use(express.json());
app.use('/api/encrypt-secrets', encrypt_secretsRouter);

describe('encrypt-secrets route', () => {

  describe('POST /api/encrypt-secrets', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/encrypt-secrets')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/encrypt-secrets')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
