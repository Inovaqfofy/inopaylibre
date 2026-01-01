import request from 'supertest';
import express from 'express';
import { rolling_updateRouter } from './rolling_update';

const app = express();
app.use(express.json());
app.use('/api/rolling-update', rolling_updateRouter);

describe('rolling-update route', () => {

  describe('POST /api/rolling-update', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/rolling-update')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/rolling-update')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
