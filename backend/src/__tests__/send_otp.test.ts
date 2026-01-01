import request from 'supertest';
import express from 'express';
import { send_otpRouter } from './send_otp';

const app = express();
app.use(express.json());
app.use('/api/send-otp', send_otpRouter);

describe('send-otp route', () => {

  describe('POST /api/send-otp', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/send-otp')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/send-otp')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
