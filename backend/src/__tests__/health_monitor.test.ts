import request from 'supertest';
import express from 'express';
import { health_monitorRouter } from './health_monitor';

const app = express();
app.use(express.json());
app.use('/api/health-monitor', health_monitorRouter);

describe('health-monitor route', () => {

  describe('POST /api/health-monitor', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/health-monitor')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/health-monitor')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
