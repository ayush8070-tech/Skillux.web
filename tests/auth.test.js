process.env.DATABASE_PATH = ':memory:';
process.env.SESSION_SECRET = 'test-secret';
const test = require('node:test');
const assert = require('node:assert/strict');
const createApp = require('../server');

function start() { return new Promise((resolve) => { const server = createApp().listen(0, () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` })); }); }
async function request(base, path, options = {}, cookie) { const response = await fetch(`${base}${path}`, { headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, ...options }); return { response, body: await response.json(), cookie: response.headers.get('set-cookie') || cookie }; }

test('local signup, session, logout, and login work', async () => {
  const { server, base } = await start();
  try {
    const signup = await request(base, '/api/auth/signup', { method: 'POST', body: JSON.stringify({ name: 'Asha', email: 'asha@example.com', password: 'secret123' }) });
    assert.equal(signup.response.status, 201); assert.equal(signup.body.user.email, 'asha@example.com');
    const me = await request(base, '/api/me', {}, signup.cookie); assert.equal(me.body.user.name, 'Asha');
    await request(base, '/api/auth/logout', { method: 'POST' }, signup.cookie);
    const login = await request(base, '/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'asha@example.com', password: 'secret123' }) }, signup.cookie);
    assert.equal(login.response.status, 200); assert.equal(login.body.user.provider, 'local');
  } finally { server.close(); }
});

test('projects API returns seeded projects', async () => {
  const { server, base } = await start();
  try { const response = await request(base, '/api/projects'); assert.ok(response.body.projects.length >= 3); }
  finally { server.close(); }
});
