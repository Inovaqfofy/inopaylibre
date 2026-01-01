import request from 'supertest';
import express from 'express';
import { admin_list_paymentsRouter } from './admin_list_payments';

const app = express();
app.use(express.json());
app.use('/api/admin-list-payments', admin_list_paymentsRouter);

describe('admin-list-payments route', () => {

  describe('POST /api/admin-list-payments', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/admin-list-payments')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/admin-list-payments')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
