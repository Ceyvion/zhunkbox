# The Zhunk Box DIY Case Lab

## Overview
- React builder for composing phone cases with draggable charms and themed palettes.
- Lightweight Node/Express API with SQLite keeps the catalog editable outside of builds.
- Secure admin console (cookie-based session, bcrypt hashes, JWT) for managing charms and case pricing.

## Getting started
- Install dependencies: `npm install`.
- Copy `.env.example` to `.env` and set `ADMIN_JWT_SECRET` plus a strong `ADMIN_DEFAULT_PASSWORD` for the initial seed user.
- Start the API in one terminal: `npm run server` (defaults to port `4000`).
- Start the Vite dev server in a second terminal: `npm run dev` (auto-proxies `/api` to the API).

## Admin console
- Visit `#/admin` or use the "Inventory" button on the landing page to open the console.
- Sign in with the seeded admin credentials; password hashes live in `data/zhunkbox.sqlite`.
- Actions available:
  - update the global case price used during checkout
  - add new charms (optionally providing a custom id and icon path)
  - edit existing charms (name, price, icon, tags)
  - delete charms from the catalog
- All catalog mutations write through the API, refresh the live builder, and persist to SQLite.

## Data storage
- SQLite database file: `data/zhunkbox.sqlite` (created on first run).
- Default catalog seed mirrored from `src/data/catalog.json`; packs remain static JSON for now.
- Uploaded charm icons should be placed under `public/icons/` and referenced by relative path.

## Scripts
- `npm run dev` – Vite dev server with API proxying.
- `npm run server` – Express API + SQLite catalog.
- `npm run build` – type-check and build the React app.
- `npm run preview` – serve the production build (expects the API to already be running).
- `npm test` / `npm run lint` – existing test and lint helpers.

## Security notes
- Update the admin password after first launch; the default seed uses `ADMIN_DEFAULT_PASSWORD`.
- Regenerate `ADMIN_JWT_SECRET` for each environment; tokens are issued as HTTP-only cookies.
- Database file contains hashed credentials and catalog data—treat it as sensitive.
