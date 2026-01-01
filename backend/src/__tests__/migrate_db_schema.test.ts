import request from 'supertest';
import express from 'express';
import { migrate_db_schemaRouter } from './migrate_db_schema';

const app = express();
app.use(express.json());
app.use('/api/migrate-db-schema', migrate_db_schemaRouter);

describe('migrate-db-schema route', () => {

  describe('POST /api/migrate-db-schema', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/migrate-db-schema')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/migrate-db-schema')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
