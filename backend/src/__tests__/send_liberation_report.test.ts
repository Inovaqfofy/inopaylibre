import request from 'supertest';
import express from 'express';
import { send_liberation_reportRouter } from './send_liberation_report';

const app = express();
app.use(express.json());
app.use('/api/send-liberation-report', send_liberation_reportRouter);

describe('send-liberation-report route', () => {

  describe('POST /api/send-liberation-report', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/send-liberation-report')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/send-liberation-report')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
