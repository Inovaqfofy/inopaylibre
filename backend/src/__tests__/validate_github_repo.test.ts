import request from 'supertest';
import express from 'express';
import { validate_github_repoRouter } from './validate_github_repo';

const app = express();
app.use(express.json());
app.use('/api/validate-github-repo', validate_github_repoRouter);

describe('validate-github-repo route', () => {

  describe('POST /api/validate-github-repo', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/validate-github-repo')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/validate-github-repo')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
