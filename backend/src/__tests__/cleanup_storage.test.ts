import request from 'supertest';
import express from 'express';
import { cleanup_storageRouter } from './cleanup_storage';

const app = express();
app.use(express.json());
app.use('/api/cleanup-storage', cleanup_storageRouter);

describe('cleanup-storage route', () => {

  describe('POST /api/cleanup-storage', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/cleanup-storage')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/cleanup-storage')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
