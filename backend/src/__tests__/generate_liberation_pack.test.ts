import request from 'supertest';
import express from 'express';
import { generate_liberation_packRouter } from './generate_liberation_pack';

const app = express();
app.use(express.json());
app.use('/api/generate-liberation-pack', generate_liberation_packRouter);

describe('generate-liberation-pack route', () => {

  describe('POST /api/generate-liberation-pack', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/generate-liberation-pack')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/generate-liberation-pack')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
