import request from 'supertest';
import express from 'express';
import { create_checkoutRouter } from './create_checkout';

const app = express();
app.use(express.json());
app.use('/api/create-checkout', create_checkoutRouter);

describe('create-checkout route', () => {

  describe('POST /api/create-checkout', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/create-checkout')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/create-checkout')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
