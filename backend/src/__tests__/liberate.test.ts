import request from 'supertest';
import express from 'express';
import { liberateRouter } from './liberate';

const app = express();
app.use(express.json());
app.use('/api/liberate', liberateRouter);

describe('liberate route', () => {

  describe('POST /api/liberate', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/liberate')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/liberate')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
