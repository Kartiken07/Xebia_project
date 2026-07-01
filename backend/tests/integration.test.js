import request from 'supertest';
import express from 'express';
import helmet from 'helmet';

const app = express();
app.use(helmet());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'Healthy'
  });
});

describe('Integration Tests', () => {
  test('Health check endpoint returns 200 Healthy', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('Healthy');
  });

  test('Helmet adds security headers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
