import request from 'supertest';
import express from 'express';
import { validate_api_keyRouter } from './validate_api_key';

const app = express();
app.use(express.json());
app.use('/api/validate-api-key', validate_api_keyRouter);

describe('validate-api-key route', () => {

  describe('POST /api/validate-api-key', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/validate-api-key')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/validate-api-key')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
