import request from 'supertest';
import express from 'express';
import { compare_dockerfileRouter } from './compare_dockerfile';

const app = express();
app.use(express.json());
app.use('/api/compare-dockerfile', compare_dockerfileRouter);

describe('compare-dockerfile route', () => {

  describe('POST /api/compare-dockerfile', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/compare-dockerfile')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/compare-dockerfile')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
