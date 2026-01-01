import request from 'supertest';
import express from 'express';
import { deploy_directRouter } from './deploy_direct';

const app = express();
app.use(express.json());
app.use('/api/deploy-direct', deploy_directRouter);

describe('deploy-direct route', () => {

  describe('POST /api/deploy-direct', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/deploy-direct')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/deploy-direct')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
