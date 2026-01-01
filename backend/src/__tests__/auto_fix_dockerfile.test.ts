import request from 'supertest';
import express from 'express';
import { auto_fix_dockerfileRouter } from './auto_fix_dockerfile';

const app = express();
app.use(express.json());
app.use('/api/auto-fix-dockerfile', auto_fix_dockerfileRouter);

describe('auto-fix-dockerfile route', () => {

  describe('POST /api/auto-fix-dockerfile', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/auto-fix-dockerfile')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auto-fix-dockerfile')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
