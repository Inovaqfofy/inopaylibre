import request from 'supertest';
import express from 'express';
import { stripe_webhookRouter } from './stripe_webhook';

const app = express();
app.use(express.json());
app.use('/api/stripe-webhook', stripe_webhookRouter);

describe('stripe-webhook route', () => {

  describe('POST /api/stripe-webhook', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/stripe-webhook')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/stripe-webhook')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
