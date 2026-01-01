import request from 'supertest';
import express from 'express';
import { setup_vpsRouter } from './setup_vps';

const app = express();
app.use(express.json());
app.use('/api/setup-vps', setup_vpsRouter);

describe('setup-vps route', () => {

  describe('POST /api/setup-vps', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/setup-vps')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/setup-vps')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
