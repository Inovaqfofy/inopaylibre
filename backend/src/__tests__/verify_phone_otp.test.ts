import request from 'supertest';
import express from 'express';
import { verify_phone_otpRouter } from './verify_phone_otp';

const app = express();
app.use(express.json());
app.use('/api/verify-phone-otp', verify_phone_otpRouter);

describe('verify-phone-otp route', () => {

  describe('POST /api/verify-phone-otp', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/verify-phone-otp')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/verify-phone-otp')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
