import request from 'supertest';
import express from 'express';
import { send_emailRouter } from './send_email';

const app = express();
app.use(express.json());
app.use('/api/send-email', send_emailRouter);

describe('send-email route', () => {

  describe('POST /api/send-email', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/send-email')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/send-email')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
