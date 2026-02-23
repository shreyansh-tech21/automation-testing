/**
 * Run a test by id. Server must be running: npm run dev
 *
 * List tests:    node test-run-test.js
 * Run one test:  node test-run-test.js <id>
 * Example:       node test-run-test.js 6742a1b3c4d5e6f7890abcd1
 */

const http = require('http');

const base = 'http://localhost:5000';
const id = process.argv[2];

function request(method, path, body) {
  const url = new URL(path, base);
  return new Promise((resolve, reject) => {
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

async function main() {
  try {
    if (!id) {
      const { status, data } = await request('GET', '/tests');
      if (status !== 200) {
        console.error('Failed to list tests:', data || status);
        process.exit(1);
      }
      if (!data || data.length === 0) {
        console.log('No tests found. Create one with: npm run test:create');
        process.exit(0);
      }
      console.log('Tests (profile | id | name):\n');
      data.forEach((t) => console.log('  ', (t.profile || '-') + '  ', t._id, '  ', t.name || t.url));
      console.log('\nRun one:    node test-run-test.js <id>');
      console.log('Delete one: node test-delete-test.js <id>');
      process.exit(0);
    }

    const { status, data } = await request('POST', '/run-test/' + id);
    if (status === 404) {
      console.error('Test not found:', data?.id || id);
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
    console.log('\n--- Result ---');
    console.log('Overall:', overall);
    console.log('Test:', exec?.testName || '-');
    if (exec?.results?.length) {
      console.log('\nSteps:');
      exec.results.forEach((r, i) => {
        const mark = r.status === 'Passed' ? '✓' : '✗';
        console.log(`  ${i + 1}. ${mark} ${r.label}: ${r.status}`);
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
