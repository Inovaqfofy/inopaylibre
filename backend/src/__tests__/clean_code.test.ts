import request from 'supertest';
import express from 'express';
import { clean_codeRouter } from './clean_code';

const app = express();
app.use(express.json());
app.use('/api/clean-code', clean_codeRouter);

describe('clean-code route', () => {

  describe('POST /api/clean-code', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/clean-code')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/clean-code')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
