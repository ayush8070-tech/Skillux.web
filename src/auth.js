const crypto = require('crypto');
const db = require('./db');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, expected] = stored.split(':');
  const actual = hashPassword(password, salt).split(':')[1];
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}
async function registerLocal({ name, email, password }) {
  if (!name || !email || !password || password.length < 6) throw Object.assign(new Error('Name, valid email, and a 6+ character password are required.'), { status: 400 });
  if (db.findUserByEmail(email)) throw Object.assign(new Error('An account with this email already exists.'), { status: 409 });
  return db.publicUser(db.createUser({ name, email, passwordHash: hashPassword(password), provider: 'local' }));
}
async function loginLocal({ email, password }) {
  const user = db.findUserByEmail(email || '');
  if (!user || !user.passwordHash || !verifyPassword(password || '', user.passwordHash)) throw Object.assign(new Error('Invalid email or password.'), { status: 401 });
  return db.publicUser(user);
}
async function loginWithGoogle(idToken) {
  if (!process.env.GOOGLE_CLIENT_ID) throw Object.assign(new Error('Google sign-in is not configured on the server.'), { status: 503 });
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken || '')}`);
  if (!response.ok) throw Object.assign(new Error('Invalid Google token.'), { status: 401 });
  const payload = await response.json();
  if (payload.aud !== process.env.GOOGLE_CLIENT_ID) throw Object.assign(new Error('Google token audience mismatch.'), { status: 401 });
  let user = db.findUserByEmail(payload.email);
  if (!user) user = db.createUser({ name: payload.name || payload.email, email: payload.email, googleId: payload.sub, avatarUrl: payload.picture, provider: 'google' });
  else if (!user.googleId) user = db.updateUser(user.id, { googleId: payload.sub, avatarUrl: payload.picture || user.avatarUrl, provider: user.provider === 'local' ? 'local+google' : 'google' });
  return db.publicUser(user);
}
module.exports = { registerLocal, loginLocal, loginWithGoogle };
