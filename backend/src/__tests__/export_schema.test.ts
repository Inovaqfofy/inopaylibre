import request from 'supertest';
import express from 'express';
import { export_schemaRouter } from './export_schema';

const app = express();
app.use(express.json());
app.use('/api/export-schema', export_schemaRouter);

describe('export-schema route', () => {

  describe('POST /api/export-schema', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/export-schema')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/export-schema')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
