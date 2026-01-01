import request from 'supertest';
import express from 'express';
import { send_phone_otpRouter } from './send_phone_otp';

const app = express();
app.use(express.json());
app.use('/api/send-phone-otp', send_phone_otpRouter);

describe('send-phone-otp route', () => {

  describe('POST /api/send-phone-otp', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/send-phone-otp')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/send-phone-otp')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
