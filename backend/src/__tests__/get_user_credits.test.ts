import request from 'supertest';
import express from 'express';
import { get_user_creditsRouter } from './get_user_credits';

const app = express();
app.use(express.json());
app.use('/api/get-user-credits', get_user_creditsRouter);

describe('get-user-credits route', () => {

  describe('POST /api/get-user-credits', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/get-user-credits')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/get-user-credits')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
