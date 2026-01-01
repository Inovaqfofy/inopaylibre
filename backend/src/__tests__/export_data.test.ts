import request from 'supertest';
import express from 'express';
import { export_dataRouter } from './export_data';

const app = express();
app.use(express.json());
app.use('/api/export-data', export_dataRouter);

describe('export-data route', () => {

  describe('POST /api/export-data', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/export-data')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/export-data')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
