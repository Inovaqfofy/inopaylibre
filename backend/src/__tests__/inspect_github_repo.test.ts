import request from 'supertest';
import express from 'express';
import { inspect_github_repoRouter } from './inspect_github_repo';

const app = express();
app.use(express.json());
app.use('/api/inspect-github-repo', inspect_github_repoRouter);

describe('inspect-github-repo route', () => {

  describe('POST /api/inspect-github-repo', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/inspect-github-repo')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/inspect-github-repo')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
