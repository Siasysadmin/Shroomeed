# ShrooMEED

```
shroomeed/
├── frontend/   React + Vite storefront and the /admin panel
└── backend/    Express API, MongoDB, uploaded images
```

## Run

From this folder, in two terminals:

```bash
npm run backend    # API on http://localhost:5000
npm run frontend   # site on http://localhost:5178
```

First time only: `npm run install:all`.

## Config

- `backend/.env` — `PORT`, `MONGODB_URI`
- `frontend` — set `VITE_API_URL` to point at a deployed API (defaults to `http://localhost:5000`)

## Deploy

`npm run build` writes the site to `frontend/dist/`. `frontend/vercel.json` handles SPA routing.
