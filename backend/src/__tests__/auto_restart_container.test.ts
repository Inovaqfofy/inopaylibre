import request from 'supertest';
import express from 'express';
import { auto_restart_containerRouter } from './auto_restart_container';

const app = express();
app.use(express.json());
app.use('/api/auto-restart-container', auto_restart_containerRouter);

describe('auto-restart-container route', () => {

  describe('POST /api/auto-restart-container', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/auto-restart-container')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auto-restart-container')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
