import request from 'supertest';
import express from 'express';
import { process_project_liberationRouter } from './process_project_liberation';

const app = express();
app.use(express.json());
app.use('/api/process-project-liberation', process_project_liberationRouter);

describe('process-project-liberation route', () => {

  describe('POST /api/process-project-liberation', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/process-project-liberation')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/process-project-liberation')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
