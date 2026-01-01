import request from 'supertest';
import express from 'express';
import { estimate_cleaning_costRouter } from './estimate_cleaning_cost';

const app = express();
app.use(express.json());
app.use('/api/estimate-cleaning-cost', estimate_cleaning_costRouter);

describe('estimate-cleaning-cost route', () => {

  describe('POST /api/estimate-cleaning-cost', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/estimate-cleaning-cost')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/estimate-cleaning-cost')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
