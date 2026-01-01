import request from 'supertest';
import express from 'express';
import { purge_coolify_cacheRouter } from './purge_coolify_cache';

const app = express();
app.use(express.json());
app.use('/api/purge-coolify-cache', purge_coolify_cacheRouter);

describe('purge-coolify-cache route', () => {

  describe('POST /api/purge-coolify-cache', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/purge-coolify-cache')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/purge-coolify-cache')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
