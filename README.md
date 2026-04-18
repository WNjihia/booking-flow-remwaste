# Booking Flow — QA Assessment

A realistic 4-step skip hire booking flow with deterministic test fixtures, automated E2E tests, and full manual test coverage.

---

## Quick Start

**Docker (recommended):**
```bash
docker compose up --build
```
App available at `http://localhost:3000`. Backend API at `http://localhost:8000`.

**Local dev:**

```bash
# Terminal 1 — backend
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload     # http://localhost:8000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev                   # http://localhost:3000
```

> The frontend Vite dev server proxies `/api` requests to `http://localhost:8000` automatically.

---

## Running Automated Tests

The app and backend must both be running before executing Cypress tests.

```bash
cd automation
npm install

# Headless (CI)
npm run cy:run

# Interactive
npm run cy:open
```

**Test suite:** 19 tests across 2 spec files.

| Spec | Tests | Coverage |
|------|-------|----------|
| `general_flow.cy.js` | 10 | Postcode lookup, validation, empty state, retry, double submit, back nav, restart |
| `heavy_waste_flow.cy.js` | 9 | Heavy waste disabled skips, plasterboard branching, latency, error/retry |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/postcode/lookup` | Returns addresses for a postcode |
| POST | `/api/waste-types` | Validates and records waste type selection |
| GET | `/api/skips` | Returns 8 skip options; respects `heavyWaste` flag |
| POST | `/api/booking/confirm` | Confirms booking; guards against double submit |
| DELETE | `/api/booking/reset` | Test-only: resets backend state between runs |

---

## Deterministic Fixtures

All fixture behaviour is hardcoded in `backend/main.py` — no database required.

| Postcode | Behaviour |
|----------|-----------|
| `SW1A 1AA` | Returns 12 addresses |
| `EC1A 1BB` | Returns 0 addresses (empty state) |
| `M1 1AE` | 3-second simulated latency, then 3 addresses |
| `BS1 4DJ` | 500 error on odd-numbered calls, success on even (retry fixture) |
| Any other valid UK postcode | Returns 2 generic addresses |

Skip availability with `heavyWaste=true`: **8-yard** and **10-yard** are disabled.

---

## Mocking and Test Data Strategy

**No mocking in E2E tests.** All Cypress tests run against the real FastAPI backend. The deterministic fixture logic in `main.py` makes every test scenario predictable and repeatable without any network interception.

**Why this approach:**
- Tests exercise the full request/response cycle, catching serialisation bugs and HTTP-level issues that would be invisible with mocked responses.
- The `/api/booking/reset` endpoint resets in-memory state (call counter, confirmed bookings set) before each test, giving a clean slate without needing a database teardown.
- Fixture postcodes are stable constants — `SW1A 1AA` always returns 12 addresses, `BS1 4DJ` always fails on the first call. Tests can assert precise outcomes without flakiness.

**Selector strategy:** All interactive elements carry `data-testid` attributes. Tests never select by class name, text content, or position — only by `data-testid`. This makes selectors resilient to styling and copy changes.

---

## Plasterboard Branching Logic

Selecting **Plasterboard** on Step 2 reveals three handling options:
- `mixed_load` — plasterboard mixed with general waste
- `separate_collection` — collected and recycled separately
- `licensed_disposal` — taken to a licensed facility

The Next button on Step 2 is disabled until one of these is chosen. Switching to a different waste type clears the selection. The chosen option is passed to both `/api/waste-types` and `/api/booking/confirm`.

---

## Double Submit Prevention

The Review step sets `submitting: true` on the first click and `submitted: true` on success. The Confirm button is disabled in both states, preventing a second click. The backend also enforces idempotency — a duplicate booking (same postcode + skip + price) returns a 409 with "Booking already submitted".

---

## Deployment Notes

For a public demo link, the recommended approach is:

1. **Backend** — deploy `backend/` to [Railway](https://railway.app) or [Render](https://render.com). Set the start command to `uvicorn main:app --host 0.0.0.0 --port 8000`.
2. **Frontend** — update the proxy target in `frontend/vite.config.js` to your deployed backend URL, then deploy to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) via `npm run build`.
3. Alternatively, deploy the full Docker Compose stack to a VPS (DigitalOcean, Fly.io).