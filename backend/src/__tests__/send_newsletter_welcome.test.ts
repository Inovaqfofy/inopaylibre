import request from 'supertest';
import express from 'express';
import { send_newsletter_welcomeRouter } from './send_newsletter_welcome';

const app = express();
app.use(express.json());
app.use('/api/send-newsletter-welcome', send_newsletter_welcomeRouter);

describe('send-newsletter-welcome route', () => {

  describe('POST /api/send-newsletter-welcome', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/send-newsletter-welcome')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/send-newsletter-welcome')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
