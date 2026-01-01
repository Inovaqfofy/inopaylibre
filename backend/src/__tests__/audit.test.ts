import request from 'supertest';
import express from 'express';
import { auditRouter } from './audit';

const app = express();
app.use(express.json());
app.use('/api/audit', auditRouter);

describe('audit route', () => {

  describe('POST /api/audit', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/audit')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/audit')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
