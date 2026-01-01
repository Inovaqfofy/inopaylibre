import request from 'supertest';
import express from 'express';
import { rate_limit_newsletterRouter } from './rate_limit_newsletter';

const app = express();
app.use(express.json());
app.use('/api/rate-limit-newsletter', rate_limit_newsletterRouter);

describe('rate-limit-newsletter route', () => {

  describe('POST /api/rate-limit-newsletter', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/rate-limit-newsletter')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/rate-limit-newsletter')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
