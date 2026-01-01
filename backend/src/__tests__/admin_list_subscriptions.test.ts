import request from 'supertest';
import express from 'express';
import { admin_list_subscriptionsRouter } from './admin_list_subscriptions';

const app = express();
app.use(express.json());
app.use('/api/admin-list-subscriptions', admin_list_subscriptionsRouter);

describe('admin-list-subscriptions route', () => {

  describe('POST /api/admin-list-subscriptions', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/admin-list-subscriptions')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/admin-list-subscriptions')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
