import request from 'supertest';
import express from 'express';
import { cleanup_secretsRouter } from './cleanup_secrets';

const app = express();
app.use(express.json());
app.use('/api/cleanup-secrets', cleanup_secretsRouter);

describe('cleanup-secrets route', () => {

  describe('POST /api/cleanup-secrets', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/cleanup-secrets')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/cleanup-secrets')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
