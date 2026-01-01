import request from 'supertest';
import express from 'express';
import { detect_missing_env_varsRouter } from './detect_missing_env_vars';

const app = express();
app.use(express.json());
app.use('/api/detect-missing-env-vars', detect_missing_env_varsRouter);

describe('detect-missing-env-vars route', () => {

  describe('POST /api/detect-missing-env-vars', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/detect-missing-env-vars')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/detect-missing-env-vars')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
