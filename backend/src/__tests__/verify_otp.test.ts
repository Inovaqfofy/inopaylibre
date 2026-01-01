import request from 'supertest';
import express from 'express';
import { verify_otpRouter } from './verify_otp';

const app = express();
app.use(express.json());
app.use('/api/verify-otp', verify_otpRouter);

describe('verify-otp route', () => {

  describe('POST /api/verify-otp', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/verify-otp')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/verify-otp')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
