import request from 'supertest';
import express from 'express';
import { github_sync_webhookRouter } from './github_sync_webhook';

const app = express();
app.use(express.json());
app.use('/api/github-sync-webhook', github_sync_webhookRouter);

describe('github-sync-webhook route', () => {

  describe('POST /api/github-sync-webhook', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/github-sync-webhook')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/github-sync-webhook')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
