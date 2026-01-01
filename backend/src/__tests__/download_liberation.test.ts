import request from 'supertest';
import express from 'express';
import { download_liberationRouter } from './download_liberation';

const app = express();
app.use(express.json());
app.use('/api/download-liberation', download_liberationRouter);

describe('download-liberation route', () => {

  describe('POST /api/download-liberation', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/download-liberation')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/download-liberation')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
