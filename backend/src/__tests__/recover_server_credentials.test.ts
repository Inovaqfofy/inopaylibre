import request from 'supertest';
import express from 'express';
import { recover_server_credentialsRouter } from './recover_server_credentials';

const app = express();
app.use(express.json());
app.use('/api/recover-server-credentials', recover_server_credentialsRouter);

describe('recover-server-credentials route', () => {

  describe('POST /api/recover-server-credentials', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/recover-server-credentials')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/recover-server-credentials')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
