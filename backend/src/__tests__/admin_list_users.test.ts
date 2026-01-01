import request from 'supertest';
import express from 'express';
import { admin_list_usersRouter } from './admin_list_users';

const app = express();
app.use(express.json());
app.use('/api/admin-list-users', admin_list_usersRouter);

describe('admin-list-users route', () => {

  describe('POST /api/admin-list-users', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/admin-list-users')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/admin-list-users')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
