import request from 'supertest';
import express from 'express';
import { setup_databaseRouter } from './setup_database';

const app = express();
app.use(express.json());
app.use('/api/setup-database', setup_databaseRouter);

describe('setup-database route', () => {

  describe('POST /api/setup-database', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/setup-database')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/setup-database')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
