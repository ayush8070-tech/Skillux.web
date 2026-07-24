# Skillux.web

Full-stack freelancing marketplace demo with frontend pages, Node.js backend, file-based JSON database, local authentication, and Google sign-in/sign-up support.

## Features

- Responsive home page with project listings
- About Us and Privacy Policy sections
- Local email/password sign up and login
- Google Identity Services sign in/sign up endpoint
- JSON database for users and projects in `data/skillux.json`
- Session-based authentication API

## Setup

```bash
cp .env.example .env
npm start
```

Open http://localhost:3000.

## Google sign-in setup

1. Create an OAuth 2.0 Web Client in Google Cloud Console.
2. Add your local or production domain to authorized JavaScript origins.
3. Put the client ID in `.env` as `GOOGLE_CLIENT_ID`.
4. Restart the server.

## API

- `POST /api/auth/signup` — `{ name, email, password }`
- `POST /api/auth/login` — `{ email, password }`
- `POST /api/auth/google` — `{ idToken }`
- `POST /api/auth/logout`
- `GET /api/me`
- `GET /api/projects`
