/**
 * Run all tests for a profile. Server must be running: npm run dev
 *
 * Usage: node test-run-profile.js <profile>
 * Example: node test-run-profile.js smoke
 */

const http = require('http');

const base = 'http://localhost:5000';
const profile = process.argv[2];

if (!profile) {
  console.error('Usage: node test-run-profile.js <profile>');
  console.error('Example: node test-run-profile.js smoke');
  process.exit(1);
}

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
    const { status, data } = await request('POST', '/run-profile/' + encodeURIComponent(profile));
    if (status === 503) {
      console.error('Server or database not ready.');
      process.exit(1);
    }
    if (status === 500) {
      console.error('Error:', data?.error || data);
      process.exit(1);
    }
    console.log('Profile:', profile);
    console.log('Count:', data?.count ?? 0);
    console.log('Results:', JSON.stringify(data, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Is the server running? Start it with: npm run dev');
    process.exit(1);
  }
}

main();
