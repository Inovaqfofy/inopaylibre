import request from 'supertest';
import express from 'express';
import { extract_rls_policiesRouter } from './extract_rls_policies';

const app = express();
app.use(express.json());
app.use('/api/extract-rls-policies', extract_rls_policiesRouter);

describe('extract-rls-policies route', () => {

  describe('POST /api/extract-rls-policies', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/extract-rls-policies')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/extract-rls-policies')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
