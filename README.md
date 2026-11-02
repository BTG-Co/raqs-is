# RAQS inventory

Inventory admin for products, measurements, conversions, stock, transactions, and users. The API is the FastAPI app in `backend/`. The clients live in `frontend/`: a Next.js web app (`frontend/storefront`) and an Expo mobile app (`frontend/mobile`), sharing types and hooks in `frontend/packages/shared`.

## Prerequisites

- Python 3.11+ with the backend virtualenv (`backend/.venv`) and a running Postgres database (`DATABASE_URL` in `backend/.env`)
- Node.js 22+ and pnpm 10
- `JWT_SECRET_KEY` in `backend/.env` (HS256; use at least 32 bytes)

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

Low stock is `current_stock < 10` in the inventory row’s own unit (`LOW_STOCK_THRESHOLD` in `frontend/packages/shared`).

## Run the API

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

`Base.metadata.create_all` creates missing tables only. It does not add columns to existing tables or drop old ones. After model changes, alter Postgres yourself (or recreate the DB in local dev).

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

Sign in with a real username and password. The web login route posts form data to `POST /auth/user/token`, then loads the signed-in user from `GET /auth/me`. The session, including the access token, is stored in an httpOnly cookie. Browser API calls send `Authorization: Bearer`. The mobile app stores the same session with `expo-secure-store` and sends the same header. A 401 clears the session and returns to login. Login fields stay disabled while the request is in flight.

## Roles

ADMIN uses the full app, including the dashboard, measurements, conversions, users, settings, inventory create/delete, transaction approval, inventory detail, and the daily sales report.

STAFF can read products, view inventory, and record transactions. STAFF does not see the dashboard, measurements, conversions, users, or settings, and cannot create or delete inventory.

Product and measurement reads are open to both roles so staff can fill the transaction form. Measurement conversion reads are also open to both roles so the transaction form can offer units tied to the product’s base measurement. Product writes, conversion writes, inventory create and delete, user management, transaction approval, deleting an unapproved transaction, inventory detail, and reports are admin only.

## Inventory and transactions

An inventory row is the on-hand balance (`current_stock`) for a product and measurement. Stock changes are not edited on the inventory row. They are recorded as transactions.

1. Staff or admin creates a transaction (`POST /transactions`) with `inventory_id`, `measurement_id`, `transaction_type` (`SALE` | `PURCHASE` | `RETURN` | `ADJUSTMENT`), `quantity`, and `unit_price`. `created_by` and `total_price` come from the server. `is_approved` starts false. Creating a transaction does not change stock.
2. Admin approves one or more pending rows (`POST /transactions/approve` with `{ ids }`). Approval converts each quantity into the inventory stock unit, then applies it and sets `is_approved=True` in one commit.
3. A sale subtracts the converted quantity. Purchase, return, and adjustment add it. If any step in the batch would take stock below zero, nothing in that batch is saved.
4. An approved transaction cannot be deleted. An unapproved one can be deleted by admin.

### Measurement conversion on approve

`base_measurement_to_converted_amount` means **1 base = N converted**. Example: product base is `sako`, conversion is `1 sako = 25 kg`, sale is `5 kg` → stock delta is `5 / 25 = 0.2` sako when inventory is kept in sako.

The transaction form only offers the product’s base measurement and converted units from conversions whose `base_measurement_id` matches that product. Unit price is entered in Php.

### Inventory detail (admin)

`GET /inventory/{id}/detail` returns the inventory row, stock expressed through related conversions, and the inventory’s transactions with stock delta and running balance after each approved row. On web, use **View** on the inventory table.

## Daily sales report (admin)

`GET /reports/daily-sales?date=YYYY-MM-DD` returns approved sales for that calendar day, converted to kg per product, with `total_kg`, `total_price`, and `as_of`. Defaults to today (UTC date) when `date` is omitted.

The admin dashboard shows this as a bar chart with a day picker and an **As of &lt;date&gt;** label. A measurement named `kg` (or short name `kg`) is required so quantities can convert through each product’s base unit.

## Scripts

```bash
cd frontend
pnpm typecheck
pnpm generate:api
```
