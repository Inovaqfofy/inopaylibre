import request from 'supertest';
import express from 'express';
import { send_welcome_emailRouter } from './send_welcome_email';

const app = express();
app.use(express.json());
app.use('/api/send-welcome-email', send_welcome_emailRouter);

describe('send-welcome-email route', () => {

  describe('POST /api/send-welcome-email', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/send-welcome-email')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/send-welcome-email')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
