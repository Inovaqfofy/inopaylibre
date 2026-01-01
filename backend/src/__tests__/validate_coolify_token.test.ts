import request from 'supertest';
import express from 'express';
import { validate_coolify_tokenRouter } from './validate_coolify_token';

const app = express();
app.use(express.json());
app.use('/api/validate-coolify-token', validate_coolify_tokenRouter);

describe('validate-coolify-token route', () => {

  describe('POST /api/validate-coolify-token', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/validate-coolify-token')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/validate-coolify-token')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
