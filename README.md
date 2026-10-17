# CropShield

CropShield helps farmers record harvested crop batches, review rule-based
post-harvest risk assessments, compare illustrative mandi prices, and consider
sell-versus-store options.

> **Deployment shape:** Deploy the React/Vite frontend to **Vercel**. Deploy the
> FastAPI backend separately to a service that supports a long-running container
> and persistent storage. The current backend uses SQLite and must not run on
> ephemeral serverless storage.

## What the app does

- Public mandi price finder with state and district filters.
- Farmer accounts and crop batch records.
- Rules-based storage risk assessment and sell-or-store calculations.
- State and district selectors for all 36 Indian states and union territories.

## Important limitations

- **Mandi prices are demo data**, not live market quotes. They are illustrative
  sample values based on typical AGMARKNET ranges. Always confirm prices with
  the market before making a selling decision.
- Risk scores and forecasts are guidance based on transparent rules and demo
  inputs. They are not field-validated predictions, professional agricultural
  advice, or guarantees against crop loss.
- The app stores farmer account and crop data. Use HTTPS, persistent storage,
  regular backups, and a host appropriate for personal data before inviting
  real users.
- Authentication uses bearer tokens stored by the browser. This project has
  not undergone an independent security or privacy audit and is not intended
  for regulated or high-assurance use as-is.
- SQLite is configured for a **single backend instance**. Do not scale the API
  horizontally without migrating to a shared database and reviewing the
  persistence/concurrency design.

## Architecture

```text
frontend/   React, Vite, React Router, Recharts
backend/    FastAPI, SQLite, demo market data, risk and decision logic
```

The browser calls the API using `VITE_API_BASE_URL`. In local development Vite
proxies `/api` to `http://127.0.0.1:8000`. The Vercel deployment calls the
separately hosted API over HTTPS.

## Requirements

- Node.js 20.19+ or 22.12+
- Python 3.12 recommended
- npm
- For the backend deployment: Docker-compatible hosting with a persistent
  volume/disk, or another host that can keep the SQLite database on durable
  storage

## Run locally

Open two terminals from the repository root.

### 1. Start the API

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API is available at `http://127.0.0.1:8000`. During development, interactive
API documentation is at `http://127.0.0.1:8000/docs`; production disables it by
default.

### 2. Start the frontend

```powershell
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. Vite proxies frontend `/api` requests to the local
backend. Do not set the production API URL to `localhost`; in a deployed
browser, that would refer to the visitor's computer.

## Deploy the backend

Vercel hosts the frontend in this setup; it does **not** host this project's
FastAPI + SQLite application as a Vite static site. Deploy the backend first so
you have its public HTTPS base URL.

Use a Docker-capable provider that supports a persistent disk/volume mounted
inside the backend container. Configure the service as follows:

| Setting | Value |
| --- | --- |
| Build context / service root | `backend/` |
| Dockerfile | `backend/Dockerfile` |
| Container port | `8000` |
| Health check | `/health` |
| `APP_ENV` | `production` |
| `ENABLE_API_DOCS` | `false` |
| `CROPSHIELD_DB_PATH` | `/data/cropshield.db` |
| Persistent storage mount | `/data` |
| `CORS_ORIGINS` | Your exact Vercel production origin(s), comma-separated; set after you know the Vercel domain |

Ensure the mounted `/data` directory is writable by the container's non-root
user (UID `10001`). The included Dockerfile starts Uvicorn on `0.0.0.0:8000`.
The service must provide a stable **HTTPS** URL, for example
`https://your-api-host.example`. Do not expose SQLite files or the database
directory over HTTP.

`CORS_ORIGINS` must contain the exact scheme and host of the frontend, without
paths or trailing slashes. For example:

```text
https://cropshield.vercel.app,https://www.example.com
```

Add a stable preview/staging domain only if you intend to use it. Vercel
per-deployment preview URLs change and should not be handled by opening CORS to
all origins. After changing backend environment variables, restart/redeploy the
backend.

The application creates/migrates its SQLite schema on startup. A new persistent
volume starts with an empty database. Do not expect a local
`backend/cropshield.db` to be included in the deployment image. If you need
existing records, take a consistent SQLite backup and import it into the
persistent volume using the backend provider's documented procedure before
opening the app to users.

Back up the database regularly and keep backups separate from the hosting
volume. Use SQLite's backup API or stop writes before making a file-level copy.
Do not use a temporary filesystem for `/data`.

## Deploy the frontend to Vercel

1. Push the project to a Git provider supported by Vercel and import the
   repository into Vercel.
2. In the Vercel project settings, set **Root Directory** to `frontend`.
3. Use the **Vite** framework preset and these build settings:
   - Install command: `npm ci`
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add the environment variable below to the Vercel project:

   | Name | Value |
   | --- | --- |
   | `VITE_API_BASE_URL` | The backend's HTTPS origin, e.g. `https://your-api-host.example` |

   Use the origin only: no `/api` suffix and preferably no trailing slash.
   Vercel embeds `VITE_*` values at build time, so redeploy after changing this
   variable.

5. Deploy. Open the assigned Vercel URL and test public pages, account
   registration/login, and a crop assessment. Add any custom production domain
   in Vercel, then add its exact HTTPS origin to the backend's `CORS_ORIGINS`
   and redeploy/restart the backend.

Client-side routes such as `/finder`, `/about`, `/how-it-works`, and `/contact`
are supported by the included `frontend/vercel.json` rewrite. Verify a route by
opening its URL directly in a new browser tab after deployment.

### Vercel preview deployments

Preview builds use the same project environment variables unless you configure
separate Preview values. If a preview frontend must call a separate API, set its
`VITE_API_BASE_URL` to that API and add the preview's stable origin to that
backend's `CORS_ORIGINS`. The backend intentionally does not allow every origin.

## Run checks

From the repository root:

```powershell
cd backend
python -m pip install -r requirements-dev.txt
python -m unittest discover -s tests -v

cd ..\frontend
npm ci
npm run lint
npm run build
```

Lint currently reports non-blocking React warnings; the lint command, backend
tests, and production build should complete successfully.

## API endpoints

- `GET /health` — API and database availability check.
- `GET /crops` — supported crops.
- `GET /market-meta` — states, districts, and crop metadata.
- `GET /market-prices/{crop}` — demo market prices; accepts optional `state`,
  `district`, and `market` filters.
- `POST /farmers/register`, `POST /farmers/login`, `GET /farmers/me` — farmer
  account endpoints.
- `/batches` — authenticated batch creation and listing, assessment, and
  recalculation endpoints.

Production API documentation is disabled. For local development, open
`http://127.0.0.1:8000/docs`.

## Demo walkthrough

1. Open the app and choose **Farmer Login** / **Get Started**.
2. Register with a name, phone number, password of at least 8 characters, and
   optional location.
3. Register a crop batch. For example: tomato, 500 kg, Nashik district,
   open-room storage, temperature 30°C, and humidity 85%.
4. Review the crop-risk assessment and sell-or-store comparison.
5. Open **Mandi Price Finder** and filter by state and district. Prices and
   forecasts are demo values; they are not live market data.

## Project files

| File | Purpose |
| --- | --- |
| `frontend/src/` | React application and API client |
| `frontend/vercel.json` | Vercel client-side route fallback |
| `frontend/vite.config.js` | Local Vite server and `/api` development proxy |
| `backend/main.py` | FastAPI routes, authentication, and startup |
| `backend/database.py` | SQLite connection, initialization, and migrations |
| `backend/india_locations.json` | Bundled Indian state/district dataset |
| `backend/market_data.py` | Clearly labeled sample mandi prices and metadata |
| `backend/risk_engine.py` | Rules-based crop/storage risk assessment |
| `backend/decision_engine.py` | Sell-versus-store calculations |
| `backend/Dockerfile` | Container image for separately hosted API |

## Data and model notes

Mandi price displays are **DEMO DATA** based on typical AGMARKNET ranges; they
are not fetched from a live government API. No API key is required.

The bundled location snapshot contains 36 states and union territories and 784
districts. It was obtained from the
[Indian state/district dataset](https://github.com/KTBsomen/Indian-state-district-json),
which identifies the
[Indian government IGOD state and district directory](https://igod.gov.in/sg/district/states)
as its source. Review and refresh the snapshot if administrative boundaries or
names change.

Risk assessment uses transparent, rules-based crop/storage checks, including
temperature, humidity, storage duration/type, and visible crop condition. Price
outlooks and financial comparisons are illustrative. They have not been
validated against field outcomes and should not be treated as guaranteed
predictions or financial advice.
