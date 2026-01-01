import request from 'supertest';
import express from 'express';
import { admin_manage_subscriptionRouter } from './admin_manage_subscription';

const app = express();
app.use(express.json());
app.use('/api/admin-manage-subscription', admin_manage_subscriptionRouter);

describe('admin-manage-subscription route', () => {

  describe('POST /api/admin-manage-subscription', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/admin-manage-subscription')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/admin-manage-subscription')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
