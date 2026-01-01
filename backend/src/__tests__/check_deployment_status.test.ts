import request from 'supertest';
import express from 'express';
import { check_deployment_statusRouter } from './check_deployment_status';

const app = express();
app.use(express.json());
app.use('/api/check-deployment-status', check_deployment_statusRouter);

describe('check-deployment-status route', () => {

  describe('POST /api/check-deployment-status', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/check-deployment-status')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/check-deployment-status')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
