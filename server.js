const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('./src/db');
const { registerLocal, loginLocal, loginWithGoogle } = require('./src/auth');

const sessions = new Map();
const publicDir = path.join(__dirname, 'public');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
function parseCookies(header = '') { return Object.fromEntries(header.split(';').filter(Boolean).map((part) => { const [k, ...v] = part.trim().split('='); return [k, decodeURIComponent(v.join('='))]; })); }
function send(res, status, body, headers = {}) { res.writeHead(status, { 'Content-Type': 'application/json', ...headers }); res.end(JSON.stringify(body)); }
function readBody(req) { return new Promise((resolve, reject) => { let data = ''; req.on('data', (chunk) => data += chunk); req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (error) { reject(Object.assign(new Error('Invalid JSON body.'), { status: 400 })); } }); }); }
function sessionFor(req, res) { const sid = parseCookies(req.headers.cookie).sid; if (sid && sessions.has(sid)) return sessions.get(sid); const id = crypto.randomUUID(); const session = {}; sessions.set(id, session); res.setHeader('Set-Cookie', `sid=${encodeURIComponent(id)}; HttpOnly; SameSite=Lax; Path=/`); return session; }
function serveStatic(req, res) { const target = req.url === '/' ? '/index.html' : req.url; const file = path.normalize(path.join(publicDir, target.split('?')[0])); if (!file.startsWith(publicDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return false; res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res); return true; }
function createApp() {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if ((req.method === 'GET' || req.method === 'HEAD') && !url.pathname.startsWith('/api/') && serveStatic(req, res)) return;
      const session = sessionFor(req, res);
      if (req.method === 'GET' && url.pathname === '/api/config') return send(res, 200, { googleClientId: process.env.GOOGLE_CLIENT_ID || '' });
      if (req.method === 'GET' && url.pathname === '/api/me') return send(res, 200, { user: session.user || null });
      if (req.method === 'GET' && url.pathname === '/api/projects') return send(res, 200, { projects: db.listProjects() });
      if (req.method === 'POST' && url.pathname === '/api/auth/signup') { session.user = await registerLocal(await readBody(req)); return send(res, 201, { user: session.user }); }
      if (req.method === 'POST' && url.pathname === '/api/auth/login') { session.user = await loginLocal(await readBody(req)); return send(res, 200, { user: session.user }); }
      if (req.method === 'POST' && url.pathname === '/api/auth/google') { const body = await readBody(req); session.user = await loginWithGoogle(body.idToken); return send(res, 200, { user: session.user }); }
      if (req.method === 'POST' && url.pathname === '/api/auth/logout') { if (parseCookies(req.headers.cookie).sid) sessions.delete(parseCookies(req.headers.cookie).sid); return send(res, 200, { ok: true }); }
      send(res, 404, { error: 'Not found' });
    } catch (error) { send(res, error.status || 500, { error: error.message || 'Server error' }); }
  });
}
if (require.main === module) { const port = process.env.PORT || 3000; createApp().listen(port, () => console.log(`Skillux running at http://localhost:${port}`)); }
module.exports = createApp;
