import request from 'supertest';
import express from 'express';
import { get_coolify_app_detailsRouter } from './get_coolify_app_details';

const app = express();
app.use(express.json());
app.use('/api/get-coolify-app-details', get_coolify_app_detailsRouter);

describe('get-coolify-app-details route', () => {

  describe('POST /api/get-coolify-app-details', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/get-coolify-app-details')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/get-coolify-app-details')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
