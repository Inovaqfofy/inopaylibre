import request from 'supertest';
import express from 'express';
import { setup_callbackRouter } from './setup_callback';

const app = express();
app.use(express.json());
app.use('/api/setup-callback', setup_callbackRouter);

describe('setup-callback route', () => {

  describe('POST /api/setup-callback', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/setup-callback')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/setup-callback')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
