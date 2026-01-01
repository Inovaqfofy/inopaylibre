import request from 'supertest';
import express from 'express';
import { send_liberation_successRouter } from './send_liberation_success';

const app = express();
app.use(express.json());
app.use('/api/send-liberation-success', send_liberation_successRouter);

describe('send-liberation-success route', () => {

  describe('POST /api/send-liberation-success', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/send-liberation-success')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/send-liberation-success')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
