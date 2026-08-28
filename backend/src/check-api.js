const http = require('http');

http.get('http://localhost:3001/api/products', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const result = JSON.parse(data);
    const p5 = result.data.find(p => p.batch_code === 'VAL-ACEH-005');
    console.log('VAL-ACEH-005 FROM API:', p5);
  });
}).on('error', (e) => {
  console.error('ERROR:', e);
});
