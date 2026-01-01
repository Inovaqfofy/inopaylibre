import request from 'supertest';
import express from 'express';
import { network_diagnosticRouter } from './network_diagnostic';

const app = express();
app.use(express.json());
app.use('/api/network-diagnostic', network_diagnosticRouter);

describe('network-diagnostic route', () => {

  describe('POST /api/network-diagnostic', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/network-diagnostic')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/network-diagnostic')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
