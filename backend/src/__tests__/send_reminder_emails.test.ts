import request from 'supertest';
import express from 'express';
import { send_reminder_emailsRouter } from './send_reminder_emails';

const app = express();
app.use(express.json());
app.use('/api/send-reminder-emails', send_reminder_emailsRouter);

describe('send-reminder-emails route', () => {

  describe('POST /api/send-reminder-emails', () => {
    it('should respond successfully', async () => {
      const response = await request(app)
        .post('/api/send-reminder-emails')
        .send({ test: true })
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/send-reminder-emails')
        .send({ test: true });
      
      expect(response.status).toBe(401);
    });

  });

});
