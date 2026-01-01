import request from 'supertest';
import express from 'express';
import { widget_authRouter } from './widget_auth';

const app = express();
app.use(express.json());
app.use('/api/widget-auth', widget_authRouter);

describe('widget-auth route', () => {

  describe('POST /api/widget-auth', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/widget-auth')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/widget-auth')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
