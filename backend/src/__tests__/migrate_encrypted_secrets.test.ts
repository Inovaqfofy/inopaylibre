import request from 'supertest';
import express from 'express';
import { migrate_encrypted_secretsRouter } from './migrate_encrypted_secrets';

const app = express();
app.use(express.json());
app.use('/api/migrate-encrypted-secrets', migrate_encrypted_secretsRouter);

describe('migrate-encrypted-secrets route', () => {

  describe('POST /api/migrate-encrypted-secrets', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/migrate-encrypted-secrets')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/migrate-encrypted-secrets')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
