const message = document.querySelector('#message');
const sessionState = document.querySelector('#sessionState');

async function api(path, options = {}) {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}
function show(text) { message.textContent = text; }
function renderUser(user) { sessionState.textContent = user ? `Logged in as ${user.name} (${user.email}) via ${user.provider}` : 'Not logged in yet.'; }
async function refreshSession() { renderUser((await api('/api/me')).user); }

async function loadProjects() {
  const { projects } = await api('/api/projects');
  document.querySelector('#projectList').innerHTML = projects.map((p) => `<article class="project"><strong>${p.title}</strong><p>${p.category} • ${p.budget}</p><small>${p.description}</small></article>`).join('');
}
async function submitForm(event, path) {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.target));
  const { user } = await api(path, { method: 'POST', body: JSON.stringify(body) });
  renderUser(user); show('Success!'); event.target.reset();
}

document.querySelector('#signupForm').addEventListener('submit', (event) => submitForm(event, '/api/auth/signup').catch((error) => show(error.message)));
document.querySelector('#loginForm').addEventListener('submit', (event) => submitForm(event, '/api/auth/login').catch((error) => show(error.message)));
document.querySelector('#logoutButton').addEventListener('click', async () => { await api('/api/auth/logout', { method: 'POST' }); renderUser(null); show('Logged out.'); });

api('/api/config').then(({ googleClientId }) => {
  if (!googleClientId || !window.google) return;
  google.accounts.id.initialize({ client_id: googleClientId, callback: async ({ credential }) => {
    const { user } = await api('/api/auth/google', { method: 'POST', body: JSON.stringify({ idToken: credential }) });
    renderUser(user); show('Google sign-in successful!');
  }});
  google.accounts.id.renderButton(document.querySelector('#googleSignIn'), { theme: 'outline', size: 'large', width: 260 });
});

loadProjects().catch((error) => show(error.message));
refreshSession().catch(() => renderUser(null));
