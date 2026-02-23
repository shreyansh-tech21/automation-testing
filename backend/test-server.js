// Quick test: call /health (server must be running). Run: npm run dev (in another terminal) then npm run test
const http = require('http');

const req = http.get('http://localhost:5000/health', (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    try {
      const j = JSON.parse(data);
      console.log('Health:', j);
      process.exit(j && j.ok ? 0 : 1);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });
});
req.on('error', (err) => {
  console.error('Is the server running? Start it with: npm run dev');
  process.exit(1);
});
req.setTimeout(5000, () => {
  req.destroy();
  process.exit(1);
});
