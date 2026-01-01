import request from 'supertest';
import express from 'express';
import { pre_deploy_checkRouter } from './pre_deploy_check';

const app = express();
app.use(express.json());
app.use('/api/pre-deploy-check', pre_deploy_checkRouter);

describe('pre-deploy-check route', () => {

  describe('POST /api/pre-deploy-check', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/pre-deploy-check')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/pre-deploy-check')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
