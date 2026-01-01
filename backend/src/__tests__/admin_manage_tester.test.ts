import request from 'supertest';
import express from 'express';
import { admin_manage_testerRouter } from './admin_manage_tester';

const app = express();
app.use(express.json());
app.use('/api/admin-manage-tester', admin_manage_testerRouter);

describe('admin-manage-tester route', () => {

  describe('POST /api/admin-manage-tester', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/admin-manage-tester')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/admin-manage-tester')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
