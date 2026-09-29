# RAQS inventory

Inventory admin for products, measurements, conversions, stock, and users. The API is the FastAPI app in `backend/`. The clients live in `frontend/`: a Next.js web app (`frontend/storefront`) and an Expo mobile app (`frontend/mobile`), sharing types and hooks in `frontend/packages/shared`.

## Prerequisites

- Python 3.11+ with the backend virtualenv (`backend/.venv`) and a running Postgres database (`DATABASE_URL` in `backend/.env`)
- Node.js 22+ and pnpm 10

## Environment

Web (`frontend/storefront/.env.local`, see `frontend/storefront/.env.example`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_AUTH_MODE=mock
```

Mobile (`frontend/mobile/.env`, see `frontend/mobile/.env.example`):

```bash
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_AUTH_MODE=mock
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

Open `http://localhost:3000`. Sign in with a username that already exists from `GET /users`. In mock mode the password is ignored and a banner says so.

A production build (`next build`) refuses to start when `NEXT_PUBLIC_AUTH_MODE=mock`.

## Run the mobile app

```bash
cd frontend
pnpm --filter @raqs/mobile start
```

Then press `i` or `a`, or scan the QR code with Expo Go. A release build with `EXPO_PUBLIC_AUTH_MODE=mock` shows an error screen instead of the app.

## Auth swap

There is no login endpoint. `MockAuthProvider` in `frontend/packages/shared/src/auth/mock.ts` loads `GET /users` and matches the username. The web app stores that session in an httpOnly cookie (`frontend/storefront/src/app/api/auth/login/route.ts`). The mobile app stores it with `expo-secure-store`.

When the API grows a real login, implement `AuthProvider` against `POST /auth/login` returning `{ access_token, user }`, send `Authorization: Bearer` from `createApiClient`, and set `NEXT_PUBLIC_AUTH_MODE` / `EXPO_PUBLIC_AUTH_MODE` to something other than `mock`. A 401 from the client clears the session and returns to login. Role checks in the UI are presentation only until the API enforces them.

## Roles

ADMIN uses the full app. STAFF can read products and add inventory. An inventory edit from STAFF is stored as a pending request (`POST /inventory_update_requests`) until an ADMIN approves or rejects it. Approving writes the inventory row. STAFF does not see the dashboard, measurements, conversions, users, or settings. Sign out stays available. The API does not yet check who calls approve or reject.

## Scripts

```bash
cd frontend
pnpm typecheck
pnpm generate:api
```
