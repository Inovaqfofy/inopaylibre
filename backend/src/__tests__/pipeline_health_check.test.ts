import request from 'supertest';
import express from 'express';
import { pipeline_health_checkRouter } from './pipeline_health_check';

const app = express();
app.use(express.json());
app.use('/api/pipeline-health-check', pipeline_health_checkRouter);

describe('pipeline-health-check route', () => {

  describe('POST /api/pipeline-health-check', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/pipeline-health-check')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/pipeline-health-check')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
