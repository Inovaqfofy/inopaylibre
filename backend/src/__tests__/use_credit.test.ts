import request from 'supertest';
import express from 'express';
import { use_creditRouter } from './use_credit';

const app = express();
app.use(express.json());
app.use('/api/use-credit', use_creditRouter);

describe('use-credit route', () => {

  describe('POST /api/use-credit', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/use-credit')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/use-credit')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
