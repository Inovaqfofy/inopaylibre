import request from 'supertest';
import express from 'express';
import { fetch_github_repoRouter } from './fetch_github_repo';

const app = express();
app.use(express.json());
app.use('/api/fetch-github-repo', fetch_github_repoRouter);

describe('fetch-github-repo route', () => {

  describe('POST /api/fetch-github-repo', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/fetch-github-repo')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/fetch-github-repo')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
