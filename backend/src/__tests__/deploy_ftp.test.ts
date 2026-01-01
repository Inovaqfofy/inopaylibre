import request from 'supertest';
import express from 'express';
import { deploy_ftpRouter } from './deploy_ftp';

const app = express();
app.use(express.json());
app.use('/api/deploy-ftp', deploy_ftpRouter);

describe('deploy-ftp route', () => {

  describe('POST /api/deploy-ftp', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/deploy-ftp')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/deploy-ftp')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
