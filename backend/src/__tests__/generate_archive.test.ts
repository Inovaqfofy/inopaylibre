import request from 'supertest';
import express from 'express';
import { generate_archiveRouter } from './generate_archive';

const app = express();
app.use(express.json());
app.use('/api/generate-archive', generate_archiveRouter);

describe('generate-archive route', () => {

  describe('POST /api/generate-archive', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/generate-archive')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/generate-archive')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
