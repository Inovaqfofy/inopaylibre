import request from 'supertest';
import express from 'express';
import { sync_coolify_statusRouter } from './sync_coolify_status';

const app = express();
app.use(express.json());
app.use('/api/sync-coolify-status', sync_coolify_statusRouter);

describe('sync-coolify-status route', () => {

  describe('POST /api/sync-coolify-status', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/sync-coolify-status')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/sync-coolify-status')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
