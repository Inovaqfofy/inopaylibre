import request from 'supertest';
import express from 'express';
import { auto_configure_coolify_appRouter } from './auto_configure_coolify_app';

const app = express();
app.use(express.json());
app.use('/api/auto-configure-coolify-app', auto_configure_coolify_appRouter);

describe('auto-configure-coolify-app route', () => {

  describe('POST /api/auto-configure-coolify-app', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/auto-configure-coolify-app')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auto-configure-coolify-app')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
