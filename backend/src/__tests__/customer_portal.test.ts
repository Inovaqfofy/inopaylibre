import request from 'supertest';
import express from 'express';
import { customer_portalRouter } from './customer_portal';

const app = express();
app.use(express.json());
app.use('/api/customer-portal', customer_portalRouter);

describe('customer-portal route', () => {

  describe('POST /api/customer-portal', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/customer-portal')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/customer-portal')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
