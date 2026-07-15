const http = require('http');

const data = JSON.stringify({
  branch_id: 1,
  price: 500,
  cost_price: 200
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/tests/1/branch-price',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'Bearer ' + process.argv[2] // Pass token as arg if needed, but wait I don't have a token.
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => process.stdout.write(d));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
