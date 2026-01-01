import request from 'supertest';
import express from 'express';
import { export_user_dataRouter } from './export_user_data';

const app = express();
app.use(express.json());
app.use('/api/export-user-data', export_user_dataRouter);

describe('export-user-data route', () => {

  describe('POST /api/export-user-data', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/export-user-data')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/export-user-data')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
