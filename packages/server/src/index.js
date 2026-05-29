// DoodleDash Game Server — Entry Point

const http = require('http');
const { createServer } = require('./server');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = createServer();

server.listen(PORT, HOST, () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  let ip = 'localhost';

  for (const iface of Object.values(interfaces)) {
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        ip = addr.address;
      }
    }
  }

  console.log('');
  console.log('🎨  DoodleDash Server Ready!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${ip}:${PORT}`);
  console.log('');
  console.log('   Share the Network URL with friends!');
  console.log('   All iPads open the same URL to play 🎉');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});
