import https from 'https';

const req = https.request('https://xebia-project.vercel.app/api/auth/login', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://xebia-workforce.vercel.app',
    'Access-Control-Request-Method': 'POST'
  }
}, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log('HEADERS:', res.headers);
  res.on('data', () => {});
});

req.on('error', (e) => {
  console.error(e);
});
req.end();
