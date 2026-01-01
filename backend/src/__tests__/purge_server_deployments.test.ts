import request from 'supertest';
import express from 'express';
import { purge_server_deploymentsRouter } from './purge_server_deployments';

const app = express();
app.use(express.json());
app.use('/api/purge-server-deployments', purge_server_deploymentsRouter);

describe('purge-server-deployments route', () => {

  describe('POST /api/purge-server-deployments', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/purge-server-deployments')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/purge-server-deployments')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
