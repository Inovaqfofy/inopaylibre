import request from 'supertest';
import express from 'express';
import { check_deploymentRouter } from './check_deployment';

const app = express();
app.use(express.json());
app.use('/api/check-deployment', check_deploymentRouter);

describe('check-deployment route', () => {

  describe('POST /api/check-deployment', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/check-deployment')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/check-deployment')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
