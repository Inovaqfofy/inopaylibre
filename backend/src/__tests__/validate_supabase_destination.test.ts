import request from 'supertest';
import express from 'express';
import { validate_supabase_destinationRouter } from './validate_supabase_destination';

const app = express();
app.use(express.json());
app.use('/api/validate-supabase-destination', validate_supabase_destinationRouter);

describe('validate-supabase-destination route', () => {

  describe('POST /api/validate-supabase-destination', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/validate-supabase-destination')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/validate-supabase-destination')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
