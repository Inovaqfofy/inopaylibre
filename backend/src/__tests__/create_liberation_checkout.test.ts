import request from 'supertest';
import express from 'express';
import { create_liberation_checkoutRouter } from './create_liberation_checkout';

const app = express();
app.use(express.json());
app.use('/api/create-liberation-checkout', create_liberation_checkoutRouter);

describe('create-liberation-checkout route', () => {

  describe('POST /api/create-liberation-checkout', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/create-liberation-checkout')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/create-liberation-checkout')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
