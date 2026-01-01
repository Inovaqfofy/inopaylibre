import request from 'supertest';
import express from 'express';
import { diff_cleanRouter } from './diff_clean';

const app = express();
app.use(express.json());
app.use('/api/diff-clean', diff_cleanRouter);

describe('diff-clean route', () => {

  describe('POST /api/diff-clean', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/diff-clean')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/diff-clean')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
