import { initDb } from './db/db.js';
import { seedRepository } from './repositories/seed.repository.js';
import { createApp } from './app.js';

process.env.ENABLE_UNSAFE_SQL_DEMO = 'true';

await initDb();
await seedRepository.seed();

const server = createApp().listen(0);
const address = server.address();

if (!address || typeof address === 'string') {
  throw new Error('Test server did not start');
}

const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

try {
  const ivan = await login('ivan@example.com');
  const olena = await login('olena@example.com');

  await expectStatus('missing auth returns 401', () => request('/reports'), 401);
  await expectStatus('invalid auth returns 401', () => request('/reports', {
    headers: { Authorization: 'Bearer invalid-token' }
  }), 401);

  const ownReport = await request('/reports/1', { token: ivan.token });
  assert(ownReport.status === 200, 'owner can read own report');

  await expectStatus('foreign report read returns 403', () => request('/reports/3', {
    token: ivan.token
  }), 403);
  await expectStatus('foreign report update returns 403', () => request('/reports/3', {
    method: 'PUT',
    token: ivan.token,
    body: {
      title: 'Blocked IDOR update',
      severity: 'High',
      status: 'Open',
      description: 'This update must not pass',
      reporter: 'Student'
    }
  }), 403);
  await expectStatus('foreign report delete returns 403', () => request('/reports/3', {
    method: 'DELETE',
    token: ivan.token
  }), 403);

  const createResponse = await request('/reports', {
    method: 'POST',
    token: ivan.token,
    body: {
      userId: 2,
      categoryId: 1,
      title: '<script>alert(1)</script>',
      severity: 'High',
      description: 'Stored XSS regression data must render as text in the UI',
      reporter: 'Student'
    }
  });
  assert(createResponse.status === 201, 'owner can create report');
  assert((createResponse.body as { user_id: number }).user_id === ivan.user.id, 'create ignores spoofed userId');

  const stolenRead = await request(`/reports/${(createResponse.body as { id: number }).id}`, {
    token: olena.token
  });
  assert(stolenRead.status === 403, 'new report cannot be read by another user');

  const injection = encodeURIComponent("' OR 1=1 --");
  const safeSearch = await request(`/reports/demo/safe-search?title=${injection}`, { token: ivan.token });
  assert(safeSearch.status === 200, 'safe SQL search returns 200');
  assert((safeSearch.body as { data: unknown[] }).data.length === 0, 'safe SQL search blocks injection');

  const unsafeSearch = await request(`/reports/demo/unsafe-search?title=${injection}`, { token: ivan.token });
  assert(unsafeSearch.status === 200, 'unsafe SQL demo returns 200 when explicitly enabled');
  assert((unsafeSearch.body as { data: unknown[] }).data.length > 2, 'unsafe SQL demo shows injection before fix');

  const health = await fetch(`http://127.0.0.1:${address.port}/health`);
  assert(health.headers.get('x-content-type-options') === 'nosniff', 'security header x-content-type-options exists');
  assert(health.headers.get('x-frame-options') === 'DENY', 'security header x-frame-options exists');

  console.log('Security regression passed');
} finally {
  server.close();
}

async function login(email: string) {
  const response = await request('/auth/login', {
    method: 'POST',
    body: {
      email,
      password: 'Student123!'
    }
  });

  assert(response.status === 200, `login works for ${email}`);
  return response.body as {
    token: string;
    user: {
      id: number;
      username: string;
      email: string;
    };
  };
}

async function expectStatus(name: string, action: () => Promise<TestResponse>, status: number) {
  const response = await action();
  assert(response.status === status, `${name}: expected ${status}, got ${response.status}`);
}

interface RequestOptions {
  method?: string;
  token?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

interface TestResponse {
  status: number;
  body: unknown;
}

async function request(path: string, options: RequestOptions = {}): Promise<TestResponse> {
  const headers: Record<string, string> = {
    ...options.headers
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let body: string | undefined;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const requestInit: RequestInit = {
    method: options.method ?? 'GET',
    headers
  };
  if (body !== undefined) {
    requestInit.body = body;
  }

  const response = await fetch(`${baseUrl}${path}`, requestInit);

  const text = await response.text();
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
