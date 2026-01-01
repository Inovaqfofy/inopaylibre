import request from 'supertest';
import express from 'express';
import { list_github_reposRouter } from './list_github_repos';

const app = express();
app.use(express.json());
app.use('/api/list-github-repos', list_github_reposRouter);

describe('list-github-repos route', () => {

  describe('POST /api/list-github-repos', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/list-github-repos')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/list-github-repos')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
