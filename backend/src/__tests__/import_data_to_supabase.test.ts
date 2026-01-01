import request from 'supertest';
import express from 'express';
import { import_data_to_supabaseRouter } from './import_data_to_supabase';

const app = express();
app.use(express.json());
app.use('/api/import-data-to-supabase', import_data_to_supabaseRouter);

describe('import-data-to-supabase route', () => {

  describe('POST /api/import-data-to-supabase', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/import-data-to-supabase')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/import-data-to-supabase')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
