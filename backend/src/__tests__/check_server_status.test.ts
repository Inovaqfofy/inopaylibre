import request from 'supertest';
import express from 'express';
import { check_server_statusRouter } from './check_server_status';

const app = express();
app.use(express.json());
app.use('/api/check-server-status', check_server_statusRouter);

describe('check-server-status route', () => {

  describe('POST /api/check-server-status', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/check-server-status')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/check-server-status')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
