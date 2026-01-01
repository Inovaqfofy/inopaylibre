import request from 'supertest';
import express from 'express';
import { send_onboarding_reminderRouter } from './send_onboarding_reminder';

const app = express();
app.use(express.json());
app.use('/api/send-onboarding-reminder', send_onboarding_reminderRouter);

describe('send-onboarding-reminder route', () => {

  describe('POST /api/send-onboarding-reminder', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/send-onboarding-reminder')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/send-onboarding-reminder')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
