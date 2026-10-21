// Tiny static server with SPA fallback, for QA of the web export.
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join } from 'path';
const root = process.argv[2];
const port = +(process.argv[3] ?? 8081);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };
createServer(async (req, res) => {
  let p = join(root, decodeURIComponent(req.url.split('?')[0]));
  try {
    if ((await stat(p)).isDirectory()) p = join(p, 'index.html');
  } catch {
    p = join(root, 'index.html');
  }
  try {
    const body = await readFile(p);
    res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(port, () => console.log('serving', root, 'on', port));
