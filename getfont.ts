import https from 'https';
https.get({
  hostname: 'fonts.googleapis.com',
  path: '/css2?family=Scheherazade+New:wght@400;700',
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
});
