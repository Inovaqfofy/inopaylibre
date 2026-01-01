import request from 'supertest';
import express from 'express';
import { pipeline_diagnosticRouter } from './pipeline_diagnostic';

const app = express();
app.use(express.json());
app.use('/api/pipeline-diagnostic', pipeline_diagnosticRouter);

describe('pipeline-diagnostic route', () => {

  describe('POST /api/pipeline-diagnostic', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/pipeline-diagnostic')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/pipeline-diagnostic')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
