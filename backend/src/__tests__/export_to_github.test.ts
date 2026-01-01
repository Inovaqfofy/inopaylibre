import request from 'supertest';
import express from 'express';
import { export_to_githubRouter } from './export_to_github';

const app = express();
app.use(express.json());
app.use('/api/export-to-github', export_to_githubRouter);

describe('export-to-github route', () => {

  describe('POST /api/export-to-github', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/export-to-github')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/export-to-github')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
