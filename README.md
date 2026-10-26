# RAQS inventory

Inventory admin for products, measurements, conversions, stock, and users. The API is the FastAPI app in `backend/`. The clients live in `frontend/`: a Next.js web app (`frontend/storefront`) and an Expo mobile app (`frontend/mobile`), sharing types and hooks in `frontend/packages/shared`.

## Prerequisites

- Python 3.11+ with the backend virtualenv (`backend/.venv`) and a running Postgres database (`DATABASE_URL` in `backend/.env`)
- Node.js 22+ and pnpm 10

## Environment

Web (`frontend/storefront/.env.local`, see `frontend/storefront/.env.example`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Mobile (`frontend/mobile/.env`, see `frontend/mobile/.env.example`):

```bash
EXPO_PUBLIC_API_URL=http://localhost:8000
```

Android emulators cannot use `localhost` for the host machine. Set `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000` when the API is running on the host.

`CORS_ORIGINS` on the API defaults to `http://localhost:3000`. Add another origin as a comma-separated list if the web app runs elsewhere.

Low stock is `amount < 10` in the row's own unit (`LOW_STOCK_THRESHOLD` in `frontend/packages/shared`). Conversions are labels only; amounts are not converted.

## Run the API

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

Stage 0 fixes already in this repo:

- `GET /inventory` returns a list
- `DELETE /measurements` has an empty response body
- measurement update allows saving the same name and rejects only a different row with that name
- CORS allows the web origin

Regenerate the client types after an API change:

```bash
cd backend && .venv/bin/python -c "import json; from main import app; json.dump(app.openapi(), open('../frontend/openapi.json','w'), indent=2)"
cd ../frontend && pnpm generate:api
```

## Run the web app

```bash
cd frontend
pnpm install
pnpm --filter @raqs/web dev
```

Open `http://localhost:3000`. Sign in with a username and password that already exist on `POST /auth/user/token`.

## Run the mobile app

```bash
cd frontend
pnpm --filter @raqs/mobile start
```

Then press `i` or `a`, or scan the QR code with Expo Go. Sign in with the same username and password as the web app.

## Auth

Sign in with a real username and password. The web login route posts form data to `POST /auth/user/token`, then loads the signed-in user from `GET /auth/me`. The session, including the access token, is stored in an httpOnly cookie. Browser API calls send `Authorization: Bearer`. The mobile app stores the same session with `expo-secure-store` and sends the same header. A 401 clears the session and returns to login.

## Roles

ADMIN uses the full app. STAFF can read products, view inventory, and record transactions. A transaction (`POST /transactions`) does not change `current_stock` until an ADMIN approves it (`POST /transactions/approve` with one or more ids). A sale decreases stock. A purchase, return, or adjustment increases it. An approved transaction cannot be deleted. STAFF does not see the dashboard, measurements, conversions, users, or settings, and cannot create or delete inventory. Sign out stays available. The API requires a valid token on those routes. Product and measurement reads are open to both roles so staff can fill the transaction form. Product writes, inventory create and delete, user management, transaction approval, and deleting an unapproved transaction are admin only.

## Scripts

```bash
cd frontend
pnpm typecheck
pnpm generate:api
```
