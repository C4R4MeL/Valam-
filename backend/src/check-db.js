const http = require('http');

http.get('http://localhost:3001/api/products', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('PRODUCTS FROM API:', JSON.parse(data));
  });
}).on('error', (e) => {
  console.error('ERROR:', e);
});
