# BJP Keep Project Context

This file is a working memory note for future AI/dev sessions. Read it before making changes.

## What This Project Is

BJP Keep is a private home inventory app for tracking where household items are stored.

It is currently packaged as a Home Assistant Add-on in the `bjpkeep_ha/` folder. The app itself is a Next.js 16 / React / TypeScript application backed by Prisma + SQLite. It stores item photos on disk and uses QR codes to identify cabinets.

The repository root contains:

- `repository.yaml`: Home Assistant add-on repository metadata.
- `bjpkeep_ha/`: the actual add-on/app.

## Main User Goals

- Use BJP Keep inside Home Assistant as an add-on.
- Keep the existing add-on/Ingress UI working.
- Also expose a small Lovelace API + custom card path so non-admin HA dashboard users can use the app from a dashboard card.
- Use QR labels on cabinets permanently. QR codes must not depend on Home Assistant Ingress tokens.
- Optimize for personal home use first, not public distribution yet.

## Important Architecture

### Home Assistant Add-on

The add-on is in `bjpkeep_ha/`.

Important files:

- `bjpkeep_ha/config.yaml`: Home Assistant add-on config.
- `bjpkeep_ha/Dockerfile`: HA local build image.
- `bjpkeep_ha/run.sh`: runtime setup and app start.
- `bjpkeep_ha/server.mjs`: custom Next server for HA Ingress path rewriting.

Runtime storage is currently hardcoded for the user's setup:

- Database: `/share/HAShare/bjpkeep/bjpkeep.db`
- Uploads: `/share/HAShare/bjpkeep/uploads/items`

This is fine for personal use. If distributing publicly, make this configurable.

### Ingress Handling

Do not use Next middleware for Ingress. The current solution is the custom `server.mjs`.

`server.mjs` does these things:

- Reads `x-ingress-path`.
- Strips the ingress prefix before passing requests to Next.
- Rewrites HTML/RSC/CSS/JS body references from `/_next/`, `/fonts/`, `/favicon.ico` to the current ingress prefix.
- Rewrites `Link` headers for preload assets. This fixed stylesheet MIME errors from root `/_next/static/...` requests.
- Rewrites redirect `Location` headers.
- Normalizes `/api/lovelace` to `/api/lovelace/` to avoid 308 redirect issues with CORS/preflight.
- Adds CORS headers to `/api/lovelace*` and `/lovelace/*`.

Client-side navigation/fetch rules:

- Use `BaseLink` from `src/lib/ingress-utils.tsx` for links inside the app.
- Use `prefixedFetch` or `usePrefixedFetch` for client-side API calls.
- Server redirects should use `getServerPrefixedPath` from `src/lib/ingress-utils-server.ts`.

`BaseLink` intentionally renders an `<a>` instead of Next `<Link>` because Next client routing can generate bad paths under HA Ingress.

### Fonts

Do not reintroduce `next/font/google`.

`Noto Sans Thai` is self-hosted:

- `public/fonts/NotoSansThai-thai.woff2`
- `public/fonts/NotoSansThai-latin.woff2`
- `public/fonts/NotoSansThai-latin-ext.woff2`

CSS is in `src/app/globals.css`, and `server.mjs` rewrites `/fonts/` for Ingress.

### QR Code Strategy

Old approach: QR encoded HA Ingress URLs. This caused 401 because Ingress tokens change.

Current approach: cabinet QR encodes a permanent payload:

```text
bjpkeep:cabinet:<cabinetId>
```

Helpers:

- `src/lib/cabinet-qr.ts`

QR page:

- `src/app/cabinets/[id]/qr/page.tsx`

Scanner:

- `src/components/qr/qr-scanner.tsx`

On iOS Home Assistant app, live `getUserMedia` did not work. The scanner now uses a single file/camera picker button and decodes the chosen photo with `jsQR`.

### Images And Thumbnails

Inventory used to load full-size original photos, which was slow.

Current thumbnail system:

- Full uploads still live at `/uploads/items/<filename>`.
- Inventory list uses `/uploads/items/thumbs/<same-basename>.jpg`.
- New uploads generate thumbnails immediately.
- Old uploads generate thumbnails lazily the first time the thumbnail route is requested.

Important files:

- `src/lib/item-images.ts`
- `src/lib/item-thumbnails.ts`
- `src/app/uploads/items/[filename]/route.ts`
- `src/app/uploads/items/thumbs/[filename]/route.ts`
- `src/app/api/upload/route.ts`
- `src/app/api/items/delete-image/route.ts`
- `src/app/inventory/page.tsx`

Item detail pages still use original images for quality.

### Activity User Names

Home Assistant Ingress sends user info with:

- `x-remote-user-display-name`
- `x-remote-user-name`
- `x-remote-user-id`

`src/lib/auth.ts` uses display name first, then username, then id, then cookie fallback, then `System`.

### Lovelace API And Card

The add-on now exposes port `3000/tcp` for Lovelace usage while preserving Ingress.

Config:

```yaml
ports:
  3000/tcp: 3000
options:
  lovelace_token: ""
schema:
  lovelace_token: "str?"
```

`run.sh` exports `LOVELACE_API_TOKEN` when `lovelace_token` is set.

Lovelace API:

- `src/lib/lovelace-api.ts`
- `src/app/api/lovelace/route.ts`

Auth:

- `Authorization: Bearer <token>`
- or `X-BJPKeep-Token: <token>`
- or query `?token=<token>`

Resources:

- `GET /api/lovelace/?resource=rooms`
- `GET /api/lovelace/?resource=cabinets`
- `GET /api/lovelace/?resource=cabinet&id=<cabinetId>`
- `GET /api/lovelace/?resource=items&q=<query>`
- `GET /api/lovelace/?resource=items&cabinetId=<cabinetId>`

Actions:

- `POST /api/lovelace/` with `{ "action": "create_item", "name": "...", "cabinetId": "..." }`
- `POST /api/lovelace/` with `{ "action": "update_item", "id": "...", "name": "...", "cabinetId": "..." }`
- `POST /api/lovelace/` with `{ "action": "delete_item", "id": "..." }`

Static Lovelace card assets:

- `public/lovelace/bjpkeep-card.js`
- `public/lovelace/jsQR.js`

Tested locally:

- `/lovelace/bjpkeep-card.js`: `200 application/javascript`, CORS `*`
- `/lovelace/jsQR.js`: `200 application/javascript`, CORS `*`
- `/api/lovelace/` without token: `401`
- `/api/lovelace/` with token: `200`

Example HA Lovelace resource:

```yaml
url: http://192.168.1.222:3000/lovelace/bjpkeep-card.js
type: module
```

Example card:

```yaml
type: custom:bjpkeep-card
api_url: http://192.168.1.222:3000
api_token: "same-value-as-lovelace_token"
actor: "Dashboard"
```

The card MVP currently supports cabinet selection, search, QR photo scan, add item, edit item name, and delete item.

## Features Already Implemented

- Home Assistant add-on packaging.
- Custom Next server for HA Ingress.
- Static asset/path rewriting for CSS/JS/fonts/favicon.
- API and client navigation prefix handling.
- Self-hosted Noto Sans Thai font.
- Item add/edit/delete/move basics.
- Room and cabinet creation.
- Room and cabinet editing.
- Cabinet detail page with inline add item form.
- Permanent cabinet QR payloads.
- Dashboard scanner simplified for iOS photo picker.
- Image thumbnails for fast Inventory.
- Lovelace public API + custom card MVP.
- Add-on icon/logo files exist at add-on root.

## Known Caveats

- HA Ingress add-on UI is admin-only in Home Assistant. Lovelace card is the workaround for non-admin dashboard users.
- Lovelace card talks to exposed port `3000`, not HA Ingress.
- If HA is served over HTTPS and card API is HTTP, browser mixed-content policies may matter. For local HA app usage this needs real-device testing.
- `LOVELACE_API_TOKEN` must be set or `/api/lovelace/` returns 401.
- Current public API does not yet support image upload from Lovelace card.
- Runtime paths are currently personal/setup-specific (`/share/HAShare/...`).
- Build emits a recurring Turbopack warning about upload/thumb route tracing. Builds still pass.

## Useful Commands

From `bjpkeep_ha/`:

```bash
npm run build
npm start
```

Local test server often used:

```bash
PORT=3003 LOVELACE_API_TOKEN=testtoken npm start
```

Then test:

```text
http://127.0.0.1:3003/api/lovelace/?resource=cabinets
http://127.0.0.1:3003/lovelace/bjpkeep-card.js
```

## Suggested Next Work

- Add Lovelace card image upload support.
- Add move item between cabinets in Lovelace card.
- Make Lovelace card UI prettier and more HA-native.
- Add edit/delete for cabinets/rooms through Lovelace if needed.
- Consider configurable storage path if the add-on will be shared publicly.
- Consider a proper backup/restore workflow for SQLite + uploads.
