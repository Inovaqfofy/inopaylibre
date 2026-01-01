import request from 'supertest';
import express from 'express';
import { global_resetRouter } from './global_reset';

const app = express();
app.use(express.json());
app.use('/api/global-reset', global_resetRouter);

describe('global-reset route', () => {

  describe('POST /api/global-reset', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/global-reset')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/global-reset')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
