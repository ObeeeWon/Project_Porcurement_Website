# ARPS — Applied Research Procurement System

A role-based procurement workflow app for the Sydney Waterfront Campus, deployed on
Cloudflare Pages with a shared Cloudflare D1 backend.

Live: https://procurement.fung-ai.com

## Roles / pages

| Page | URL | Purpose |
| --- | --- | --- |
| Landing | `/` | Policy guidelines + role launcher |
| Employee | `/employee.html` | Submit goods/services purchase requests |
| Manager | `/manager.html` | Approve / reject requests |
| Finance | `/finance.html` | Initial audit, send to IT, release funds |
| IT Review | `/it_review.html` | Technical clearance of flagged requests |
| Vendors | `/vendors.html` | NSCC approved vendor list (demo) |
| Vendor Registration | `/vendor-register.html` | Register a new vendor (demo) |

## Approval workflow

```
Reviewing ──▶ (Pending IT ──▶ IT Approved) ──▶ Approved ──▶ Finalized
        └────────────────── Rejected ──────────────────┘
```

- Employee submits → `Reviewing`
- Manager approves → `Approved` (or `Pending IT` when "IT Technical Review" was requested)
- IT clears `Pending IT` → `IT Approved`
- Finance moves `Approved` → `Pending IT` (initial audit) and `IT Approved` → `Finalized`

## Architecture

- **Frontend**: static HTML + Tailwind (CDN) in [`public/`](public/), data access via [`public/js/api.js`](public/js/api.js).
- **API**: Cloudflare Pages Functions in [`functions/api/`](functions/api/).
- **Database**: Cloudflare D1 (`procurement_db`), schema in [`migrations/0001_init.sql`](migrations/0001_init.sql).

### API endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/requests` | List all requests (newest first) |
| POST | `/api/requests` | Create a request (server assigns `ARPS-#####`) |
| GET | `/api/requests/:id` | Fetch one request |
| PATCH | `/api/requests/:id` | Update status / comment, append log |
| GET | `/api/vendors` | List vendors |
| POST | `/api/vendors` | Register a vendor |

## Local development

```bash
npm install
npm run db:init:local      # seed local D1
npm run dev                # http://localhost:8788
```

## Deploy

```bash
wrangler d1 create procurement_db          # once; copy database_id into wrangler.jsonc
npm run db:init:remote                     # apply schema to remote D1
npm run deploy                             # deploy to Cloudflare Pages
```

Custom domain `procurement.fung-ai.com` is attached to the `procurement` Pages project.

If the domain shows **pending** in Cloudflare, create the DNS record (wrangler OAuth cannot edit DNS):

| Type | Name | Target | Proxy |
| --- | --- | --- | --- |
| CNAME | `procurement` | `procurement-ah3.pages.dev` | Proxied (orange cloud) |

Or run (requires a token with **Zone → DNS → Edit** for `fung-ai.com`):

```bash
CLOUDFLARE_DNS_TOKEN=your_token npm run dns:setup
```

Create token: https://dash.cloudflare.com/profile/api-tokens → **Edit zone DNS** template → zone `fung-ai.com`.
