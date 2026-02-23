/**
 * List all tests (with profile) or delete one by id. Server must be running: npm run dev
 *
 * List:   node test-delete-test.js
 * Delete: node test-delete-test.js <id>
 */

const http = require('http');

const base = 'http://localhost:5000';
const id = process.argv[2];

function request(method, path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, base);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 5000,
        path: url.pathname,
        method,
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
    if (!id) {
      const { status, data } = await request('GET', '/tests');
      if (status !== 200) {
        console.error('Failed to list tests:', data || status);
        process.exit(1);
      }
      if (!data || data.length === 0) {
        console.log('No tests found.');
        process.exit(0);
      }
      console.log('Tests (profile | id | name):\n');
      data.forEach((t) => console.log('  ', (t.profile || '-') + '  ', t._id, '  ', t.name || t.url));
      console.log('\nTo delete: node test-delete-test.js <id>');
      process.exit(0);
    }

    const { status, data } = await request('DELETE', '/tests/' + id);
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
