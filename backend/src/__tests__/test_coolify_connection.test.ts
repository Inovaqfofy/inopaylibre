import request from 'supertest';
import express from 'express';
import { test_coolify_connectionRouter } from './test_coolify_connection';

const app = express();
app.use(express.json());
app.use('/api/test-coolify-connection', test_coolify_connectionRouter);

describe('test-coolify-connection route', () => {

  describe('POST /api/test-coolify-connection', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/test-coolify-connection')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/test-coolify-connection')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
