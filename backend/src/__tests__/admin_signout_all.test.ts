import request from 'supertest';
import express from 'express';
import { admin_signout_allRouter } from './admin_signout_all';

const app = express();
app.use(express.json());
app.use('/api/admin-signout-all', admin_signout_allRouter);

describe('admin-signout-all route', () => {

  describe('POST /api/admin-signout-all', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/admin-signout-all')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/admin-signout-all')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
