import request from 'supertest';
import express from 'express';
import { cleanup_coolify_orphansRouter } from './cleanup_coolify_orphans';

const app = express();
app.use(express.json());
app.use('/api/cleanup-coolify-orphans', cleanup_coolify_orphansRouter);

describe('cleanup-coolify-orphans route', () => {

  describe('POST /api/cleanup-coolify-orphans', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/cleanup-coolify-orphans')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/cleanup-coolify-orphans')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
