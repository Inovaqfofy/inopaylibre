import request from 'supertest';
import express from 'express';
import { generate_docker_alternativesRouter } from './generate_docker_alternatives';

const app = express();
app.use(express.json());
app.use('/api/generate-docker-alternatives', generate_docker_alternativesRouter);

describe('generate-docker-alternatives route', () => {

  describe('POST /api/generate-docker-alternatives', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/generate-docker-alternatives')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/generate-docker-alternatives')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
