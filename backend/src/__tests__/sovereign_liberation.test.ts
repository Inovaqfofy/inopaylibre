import request from 'supertest';
import express from 'express';
import { sovereign_liberationRouter } from './sovereign_liberation';

const app = express();
app.use(express.json());
app.use('/api/sovereign-liberation', sovereign_liberationRouter);

describe('sovereign-liberation route', () => {

  describe('POST /api/sovereign-liberation', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/sovereign-liberation')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/sovereign-liberation')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
