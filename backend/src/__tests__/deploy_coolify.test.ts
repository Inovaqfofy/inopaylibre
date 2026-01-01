import request from 'supertest';
import express from 'express';
import { deploy_coolifyRouter } from './deploy_coolify';

const app = express();
app.use(express.json());
app.use('/api/deploy-coolify', deploy_coolifyRouter);

describe('deploy-coolify route', () => {

  describe('POST /api/deploy-coolify', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/deploy-coolify')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/deploy-coolify')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
