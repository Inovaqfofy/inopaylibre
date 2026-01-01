import request from 'supertest';
import express from 'express';
import { verify_zero_shadow_doorRouter } from './verify_zero_shadow_door';

const app = express();
app.use(express.json());
app.use('/api/verify-zero-shadow-door', verify_zero_shadow_doorRouter);

describe('verify-zero-shadow-door route', () => {

  describe('POST /api/verify-zero-shadow-door', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/verify-zero-shadow-door')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/verify-zero-shadow-door')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
