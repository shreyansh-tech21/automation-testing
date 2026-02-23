/**
 * Run API tests: health, create-test, list tests.
 * Server must be running: npm run dev
 *
 * Usage: node test-all.js
 */

const http = require('http');

const BASE = 'http://localhost:5000';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const bodyStr = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 5000,
        path: url.pathname,
        method,
        headers: bodyStr
          ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) }
          : {},
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
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function main() {
  console.log('Testing backend API (server must be running: npm run dev)\n');

  let passed = 0;
  let failed = 0;

  // 1. Health
  try {
    const { status, data } = await request('GET', '/health');
    if (status === 200 && data && data.ok) {
      console.log('✓ GET /health - OK');
      passed++;
    } else {
      console.log('✗ GET /health - failed', status, data);
      failed++;
    }
  } catch (err) {
    console.log('✗ GET /health -', err.message);
    failed++;
    console.log('\nStart the server first: cd backend && npm run dev\n');
    process.exit(1);
  }

  // 2. Create test
  const createBody = {
    name: 'API Test',
    url: 'https://example.com',
    steps: [
      { label: 'Email', action: 'fill', value: 'test@example.com' },
      { label: 'Submit', action: 'click' },
    ],
  };
  try {
    const { status, data } = await request('POST', '/create-test', createBody);
    if (status === 200 && data && data._id) {
      console.log('✓ POST /create-test - OK (id:', data._id + ')');
      passed++;
    } else {
      console.log('✗ POST /create-test - failed', status, data);
      failed++;
    }
  } catch (err) {
    console.log('✗ POST /create-test -', err.message);
    failed++;
  }

  // 3. List tests
  try {
    const { status, data } = await request('GET', '/tests');
    if (status === 200 && Array.isArray(data)) {
      console.log('✓ GET /tests - OK (' + data.length + ' test(s))');
      passed++;
    } else {
      console.log('✗ GET /tests - failed', status, data);
      failed++;
    }
  } catch (err) {
    console.log('✗ GET /tests -', err.message);
    failed++;
  }

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
}

main();
