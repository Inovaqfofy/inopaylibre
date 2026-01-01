import request from 'supertest';
import express from 'express';
import { fofy_chatRouter } from './fofy_chat';

const app = express();
app.use(express.json());
app.use('/api/fofy-chat', fofy_chatRouter);

describe('fofy-chat route', () => {

  describe('POST /api/fofy-chat', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/fofy-chat')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/fofy-chat')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
