import request from 'supertest';
import express from 'express';
import { serve_setup_scriptRouter } from './serve_setup_script';

const app = express();
app.use(express.json());
app.use('/api/serve-setup-script', serve_setup_scriptRouter);

describe('serve-setup-script route', () => {

  describe('POST /api/serve-setup-script', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/serve-setup-script')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/serve-setup-script')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
