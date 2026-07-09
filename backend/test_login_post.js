import https from 'https';

const data = JSON.stringify({
  email: 'admin@company.com',
  password: 'Admin@123'
});

const req = https.request('https://xebia-project.vercel.app/api/auth/login', {
  method: 'POST',
  headers: {
    'Origin': 'https://xebia-workforce.vercel.app',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log('HEADERS:', res.headers);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('BODY:', body));
});

req.on('error', (e) => {
  console.error(e);
});
req.write(data);
req.end();
