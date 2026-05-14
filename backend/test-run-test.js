/**
 * Run a test by id. Server must be running: npm run dev
 *
 * List tests:    node test-run-test.js
 * Run one test:  node test-run-test.js <id>
 * Example:       node test-run-test.js 6742a1b3c4d5e6f7890abcd1
 *
 * Auth: POST /run-test requires a token. Set RUN_TEST_TOKEN or TEST_EMAIL + TEST_PASSWORD.
 */

const http = require('http');

const base = 'http://localhost:5000';
const id = process.argv[2];

function request(method, path, body, token) {
  const url = new URL(path, base);
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const headers = bodyStr
      ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) }
      : {};
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
            resolve({ status: res.statusCode, data });
          }
        });
      }
    );
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

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

async function main() {
  try {
    const token = await new Promise((resolve) => getToken(resolve));
    if (!id) {
      const { status, data } = await request('GET', '/tests', undefined, token);
      if (status === 401) {
        console.error('Unauthorized. Set RUN_TEST_TOKEN or TEST_EMAIL + TEST_PASSWORD to list/run tests.');
        process.exit(1);
      }
      if (status !== 200) {
        console.error('Failed to list tests:', data || status);
        process.exit(1);
      }
      if (!data || data.length === 0) {
        console.log('No tests found. Create one with: npm run test:create');
        process.exit(0);
      }
      console.log('Tests (type/profile | id | name):\n');
      data.forEach((t) => {
        const typeOrProfile = t.testType === 'api' ? 'api' : (t.profile || t.testType || '-');
        console.log('  ', typeOrProfile + '  ', t._id, '  ', t.name || t.url || '');
      });
      console.log('\nRun one:    node test-run-test.js <id>');
      console.log('Delete one: node test-delete-test.js <id>');
      process.exit(0);
    }

    const { status, data } = await request('POST', '/run-test/' + id, null, token);
    if (status === 401) {
      console.error('Unauthorized. Set RUN_TEST_TOKEN or TEST_EMAIL + TEST_PASSWORD (see script header).');
      process.exit(1);
    }
    if (status === 404) {
      console.error('Test not found:', data?.id || id);
      process.exit(1);
    }
    if (status === 400) {
      console.error('Run rejected:', data?.error || 'Bad request');
      if (data?.hint) console.error('Hint:', data.hint);
      if (data?.testName) console.error('Test:', data.testName);
      process.exit(1);
    }
    if (status === 500) {
      console.error('Run failed:', data?.error || data);
      process.exit(1);
    }
    if (status === 503) {
      console.error('Server or database not ready.');
      process.exit(1);
    }

    const exec = data?.execution;
    const overall = exec?.overallStatus ?? data?.execution?.overallStatus;
    if (!exec && status === 200) {
      console.error('Server returned 200 but no execution in response. Response keys:', data ? Object.keys(data) : 'none');
      if (data && typeof data === 'object') console.error('Body:', JSON.stringify(data).slice(0, 400));
    }
    console.log('\n--- Result ---');
    console.log('Overall:', overall ?? '(no execution in response)');
    console.log('Test:', exec?.testName ?? '-');
    if (exec?.results?.length) {
      console.log('\nSteps:');
      exec.results.forEach((r, i) => {
        const label = r.label ?? r.step ?? `Step ${i + 1}`;
        const mark = r.status === 'Passed' ? '✓' : '✗';
        console.log(`  ${i + 1}. ${mark} ${label}: ${r.status}`);
        if (r.responseStatus != null) console.log(`      HTTP ${r.responseStatus}`);
        if (r.status === 'Failed' && r.error) {
          console.log(`      Error: ${r.error}`);
          if (r.screenshot) console.log(`      Screenshot: ${r.screenshot}`);
        }
      });
    }
    if (data?.report) console.log('\nReport:', data.report);
    console.log('');
    process.exit(overall === 'Passed' ? 0 : 1);
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Is the server running? Start it with: npm run dev');
    process.exit(1);
  }
}

main();
