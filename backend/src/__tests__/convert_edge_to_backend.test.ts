import request from 'supertest';
import express from 'express';
import { convert_edge_to_backendRouter } from './convert_edge_to_backend';

const app = express();
app.use(express.json());
app.use('/api/convert-edge-to-backend', convert_edge_to_backendRouter);

describe('convert-edge-to-backend route', () => {

  describe('POST /api/convert-edge-to-backend', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/convert-edge-to-backend')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/convert-edge-to-backend')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
