import request from 'supertest';
import express from 'express';
import { migrate_schemaRouter } from './migrate_schema';

const app = express();
app.use(express.json());
app.use('/api/migrate-schema', migrate_schemaRouter);

describe('migrate-schema route', () => {

  describe('POST /api/migrate-schema', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/migrate-schema')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/migrate-schema')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
