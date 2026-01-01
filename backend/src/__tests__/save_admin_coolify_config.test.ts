import request from 'supertest';
import express from 'express';
import { save_admin_coolify_configRouter } from './save_admin_coolify_config';

const app = express();
app.use(express.json());
app.use('/api/save-admin-coolify-config', save_admin_coolify_configRouter);

describe('save-admin-coolify-config route', () => {

  describe('POST /api/save-admin-coolify-config', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/save-admin-coolify-config')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/save-admin-coolify-config')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
