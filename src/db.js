const path = require('path');
const fs = require('fs');

const databasePath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'skillux.json');
if (databasePath !== ':memory:') fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const seed = {
  users: [],
  projects: [
    { id: 1, title: 'Landing page design', category: 'Design', budget: '$350', description: 'Build a polished portfolio landing page for a consultant.' },
    { id: 2, title: 'MERN dashboard', category: 'Development', budget: '$1,200', description: 'Create an admin dashboard with analytics and role-based auth.' },
    { id: 3, title: 'Brand copywriting', category: 'Writing', budget: '$250', description: 'Write homepage, about, and service copy for a SaaS startup.' }
  ],
  counters: { users: 1, projects: 4 }
};
let state = structuredClone(seed);
if (databasePath !== ':memory:' && fs.existsSync(databasePath)) state = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
function persist() { if (databasePath !== ':memory:') fs.writeFileSync(databasePath, JSON.stringify(state, null, 2)); }
function publicUser(user) { return user && { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, provider: user.provider }; }
module.exports = {
  findUserByEmail(email) { return state.users.find((user) => user.email.toLowerCase() === String(email).toLowerCase()); },
  findUserById(id) { return state.users.find((user) => user.id === id); },
  createUser(user) { const record = { id: state.counters.users++, createdAt: new Date().toISOString(), ...user }; state.users.push(record); persist(); return record; },
  updateUser(id, patch) { const user = this.findUserById(id); Object.assign(user, patch); persist(); return user; },
  listProjects() { return [...state.projects].sort((a, b) => b.id - a.id); },
  publicUser
};
