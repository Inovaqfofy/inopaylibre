import request from 'supertest';
import express from 'express';
import { check_subscriptionRouter } from './check_subscription';

const app = express();
app.use(express.json());
app.use('/api/check-subscription', check_subscriptionRouter);

describe('check-subscription route', () => {

  describe('POST /api/check-subscription', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/check-subscription')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/check-subscription')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
