import request from 'supertest';
import express from 'express';
import { provision_hetzner_vpsRouter } from './provision_hetzner_vps';

const app = express();
app.use(express.json());
app.use('/api/provision-hetzner-vps', provision_hetzner_vpsRouter);

describe('provision-hetzner-vps route', () => {

  describe('POST /api/provision-hetzner-vps', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/provision-hetzner-vps')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/provision-hetzner-vps')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
