import { describe, it, expect } from 'vitest';
import request from 'supertest';
// Adjusting path relative to tests/e2e/phase0/health.test.ts
import app from '../../../apps/backend/src/app';

describe('Phase 0: Health Endpoint', () => {
    it('should return a 200 OK with status: ok', async () => {
        const response = await request(app).get('/api/health');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'ok' });
    });
});
