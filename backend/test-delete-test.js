/**
 * List all tests (with profile) or delete one by id. Server must be running: npm run dev
 *
 * List:   node test-delete-test.js
 * Delete: node test-delete-test.js <id>
 *
 * Auth: DELETE /tests/:id and GET /tests require a token. Set RUN_TEST_TOKEN, CREATE_TEST_TOKEN, or TEST_EMAIL + TEST_PASSWORD.
 */

const http = require('http');

const base = 'http://localhost:5000';
const id = process.argv[2];

function getToken(cb) {
  const token = process.env.RUN_TEST_TOKEN || process.env.CREATE_TEST_TOKEN;
  if (token) return cb(token);
  const email = process.env.TEST_EMAIL?.replace(/^["']|["']$/g, '');
  const password = process.env.TEST_PASSWORD?.replace(/^["']|["']$/g, '');
  if (!email || !password) return cb(null);
  const loginUrl = new URL('/auth/login', base);
  const body = JSON.stringify({ email, password });
  const req = http.request(
    {
      hostname: loginUrl.hostname,
      port: loginUrl.port || 5000,
      path: loginUrl.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    },
    (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          cb(parsed.token || null);
        } catch {
          cb(null);
        }
      });
    }
  );
  req.on('error', () => cb(null));
  req.write(body);
  req.end();
}

function request(method, path, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, base);
    const headers = {};
    if (token) headers.Authorization = 'Bearer ' + token;
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 5000,
        path: url.pathname,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
          } catch {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    const token = await new Promise((resolve) => getToken(resolve));
    if (!id) {
      const { status, data } = await request('GET', '/tests', token);
      if (status === 401) {
        console.error('Unauthorized. Set RUN_TEST_TOKEN, CREATE_TEST_TOKEN, or TEST_EMAIL + TEST_PASSWORD.');
        process.exit(1);
      }
      if (status !== 200) {
        console.error('Failed to list tests:', data || status);
        process.exit(1);
      }
      if (!data || data.length === 0) {
        console.log('No tests found.');
        process.exit(0);
      }
      console.log('Tests (type/profile | id | name):\n');
      data.forEach((t) => {
        const typeOrProfile = t.testType === 'api' ? 'api' : (t.profile || t.testType || '-');
        console.log('  ', typeOrProfile + '  ', t._id, '  ', t.name || t.url || '');
      });
      console.log('\nTo delete: node test-delete-test.js <id>');
      process.exit(0);
    }

    const { status, data } = await request('DELETE', '/tests/' + id, token);
    if (status === 401) {
      console.error('Unauthorized. Set RUN_TEST_TOKEN, CREATE_TEST_TOKEN, or TEST_EMAIL + TEST_PASSWORD.');
      process.exit(1);
    }
    if (status === 404) {
      console.error('Test not found:', id);
      process.exit(1);
    }
    if (status !== 200) {
      console.error('Delete failed:', data?.error || status);
      process.exit(1);
    }
    console.log('Deleted:', data?.name || id);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Is the server running? npm run dev');
    process.exit(1);
  }
}

main();
