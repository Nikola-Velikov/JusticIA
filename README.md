# JusticIA Frontend

React + Vite + TypeScript frontend for JusticIA.

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: build for production
- `npm run preview`: preview the production build

## Backend

This repo includes a standalone Express + MongoDB backend under `server-side/`.
See `server-side/README.md` for setup and endpoints.

## Deployment

Recommended split:

- Frontend → Vercel (Vite static hosting)
- Backend + MongoDB → Railway (Node server + managed Mongo)

### Environment Variables

- Frontend (root `.env`; see `.env.example`):
  - `VITE_API_BASE_URL` = `https://<railway-backend>.railway.app`

- Backend (`server-side/.env`; see `server-side/.env.example`):
  - `NODE_ENV` = `production`
  - `PORT` = `8080` (Railway sets `PORT`; keep as fallback)
  - `MONGO_URI` = Mongo connection string
  - `JWT_SECRET` = long random string
  - `CORS_ORIGIN` = `https://<your-vercel-frontend>` (or custom domain)
  - `GENERATE_URL` = upstream generator URL

### Backend on Railway

1. New Project → Deploy from GitHub → select this repo
2. Service config
   - Root directory: `server-side`
   - Build: `npm run build`
   - Start: `npm run start`
3. Add Mongo database (Railway → Add → Database → MongoDB)
   - Copy connection string → set `MONGO_URI`
4. Set variables: `NODE_ENV`, `JWT_SECRET`, `MONGO_URI`, `CORS_ORIGIN`, `GENERATE_URL`
5. Deploy and verify: open `https://<railway-app>.railway.app/api/health` → `{ "status": "ok" }`

### Frontend on Vercel

1. New Project → Import GitHub repo
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
2. Add env var: `VITE_API_BASE_URL` = `https://<railway-app>.railway.app`
3. Deploy → test the app

### CORS Wiring

Set `CORS_ORIGIN` in Railway to your Vercel URL (or custom domain) so the browser can call the API.

### Health and Base URL

- API health: `GET /api/health`
- Client requests: `${VITE_API_BASE_URL}/api/...`
