# BJP Keep Project Context

This file is a working memory note for future AI/dev sessions. Read it at the start of every new chat/session before answering or making changes.

IMPORTANT: Update this file every time code, config, docs, UX, packaging, or behavior changes. This is the durable memory for new chat sessions, so do not rely on the previous chat history being available.

Whenever the user asks for code/config/product changes, update this file in the same work session:

- Record what changed.
- Remove or revise any TODO/next-work items that were completed.
- Keep notes factual and useful for the next AI/dev session.
- Include enough detail that a new AI/dev session can understand the current project state without seeing older chat logs.

## What This Project Is

BJP Keep is a private home inventory app for tracking where household items are stored.

It is currently packaged as a Home Assistant Add-on in the `bjpkeep_ha/` folder. The app itself is a Next.js 16 / React / TypeScript application backed by Prisma + SQLite. It stores item photos on disk and uses QR codes to identify cabinets.

The repository root contains:

- `repository.yaml`: Home Assistant add-on repository metadata.
- `README.md`: user-facing setup guide from adding the HA add-on repository through Lovelace card setup and troubleshooting.
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
- `GET /api/lovelace/?resource=cabinets&includeItems=0` for a lightweight cabinet list without nested items
- `GET /api/lovelace/?resource=cabinet&id=<cabinetId>`
- `GET /api/lovelace/?resource=items&q=<query>`
- `GET /api/lovelace/?resource=items&cabinetId=<cabinetId>`
- `GET /api/lovelace/?resource=items&page=1&pageSize=10` for paginated item lists. `pageSize` is capped at 50.

Actions:

- `POST /api/lovelace/` with `{ "action": "create_item", "name": "...", "cabinetId": "..." }`
- `POST /api/lovelace/` with `{ "action": "update_item", "id": "...", "name": "...", "cabinetId": "..." }`
- `POST /api/lovelace/` with `{ "action": "delete_item", "id": "..." }`
- `POST /api/lovelace/` multipart form with `action=create_item`, `name`, `cabinetId`, and one or more `files` to create an item with photos.
- `POST /api/lovelace/` multipart form with `action=add_images`, `itemId`, and one or more `files` to add photos to an existing item.
- `POST /api/lovelace/` with `{ "action": "delete_image", "imageId": "..." }` to remove an item photo and its thumbnail/original file.

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
actor: "{{ user }}"
page_size: 10
```

The card currently supports all-cabinet or per-cabinet item lists, item thumbnails, cabinet selection, manual search with Search button/Enter (no auto-refresh while typing), clear/refresh controls, pagination, QR photo scan, add item with photos, edit item name, add/remove item photos, move item to another cabinet, and delete item.

Current Lovelace card UX:

- The item list is compact: thumbnail, item name, and room/cabinet location only.
- Clicking an item row opens an item detail popup.
- Item rename/edit, move, add photo, remove selected photo, and delete actions live in the item detail popup instead of cluttering the list.
- Add Item opens as a popup instead of being permanently expanded in the card.
- The custom card registers `window.customCards` metadata so it can appear in Home Assistant's visual Add Card picker after the JS resource is loaded.

The custom card also provides a Home Assistant visual config editor via `getConfigElement()` / `bjpkeep-card-editor`, so dashboard users can manage `api_url`, `api_token`, `title`, `actor`, `cabinet_id`, `page_size`, and `show_images` from the HA card editor UI after the JS resource has been added.

Recent Lovelace card UX fixes:

- Search controls were cleaned up for narrow Home Assistant cards. The clear `x` button now sits inside the search input, and the Search/Refresh/Add item controls use a responsive grid so button text does not overflow.
- Add item now works when the card is showing `All cabinets`. The Add item popup includes its own cabinet dropdown. If a cabinet filter is already selected, that cabinet is preselected in the popup.
- The Lovelace search submit control is now an icon button inside the search field.
- The item detail popup now keeps its own current item/photo state. Adding photos updates the popup immediately, all item photos can be selected from thumbnails, and Remove Photo deletes the currently displayed photo instead of always deleting the first image.
- The Lovelace card default actor is `{{ user }}`. The custom card resolves that token itself from Home Assistant `hass.user.name`/`hass.user.id` before sending `X-BJPKeep-Actor`, because arbitrary custom card config is not Markdown-rendered by Home Assistant.

Recent Docker/build fix:

- `bjpkeep_ha/Dockerfile` uses `npm ci` instead of `npm install` for deterministic image builds from `package-lock.json`.
- Docker build npm retry/timeout environment settings were added to reduce Home Assistant Supervisor build failures from slow or flaky network reads.
- Keep `package.json`, `package-lock.json`, and `config.yaml` versions in sync when bumping releases.

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
- Lovelace item API supports pagination and lightweight cabinet fetches for large inventories.
- Lovelace card/API supports photo upload while adding an item, adding photos to an existing item, and deleting an item photo.
- Lovelace card has a visual Home Assistant config editor and stub config for UI-based card creation/editing.
- Lovelace card registers custom-card metadata for Home Assistant's visual Add Card picker.
- Lovelace card uses compact item rows with click-to-open item detail popup.
- Lovelace Add Item form opens in a popup.
- Lovelace Add Item popup can create an item from `All cabinets` by selecting a cabinet in the popup.
- Lovelace search controls are responsive; clear search is an inline `x` inside the input.
- Lovelace item detail popup supports multi-photo thumbnails and deletes the currently selected/displayed photo.
- Root `README.md` documents the full Home Assistant installation flow, add-on configuration, Lovelace resource/card setup, test URLs, and troubleshooting.

## Known Caveats

- HA Ingress add-on UI is admin-only in Home Assistant. Lovelace card is the workaround for non-admin dashboard users.
- Lovelace card talks to exposed port `3000`, not HA Ingress.
- If HA is served over HTTPS and card API is HTTP, browser mixed-content policies may matter. For local HA app usage this needs real-device testing.
- `LOVELACE_API_TOKEN` must be set or `/api/lovelace/` returns 401.
- If the Lovelace card shows repeated `/api/lovelace/?resource=cabinets` 401 errors, the dashboard card config is missing `api_token`, the token does not match `lovelace_token`, or the add-on was not restarted after changing the token.
- The Lovelace JS resource still has to be added to HA resources before the visual card editor can appear.
- Runtime paths are currently personal/setup-specific (`/share/HAShare/...`).
- Build emits a recurring Turbopack warning about upload/thumb route tracing. Builds still pass.

## Suggested Next Lovelace Work

- Add an optional read-only dashboard summary mode.
- Consider optional sorting and page-size controls in the card UI if 100+ item inventories become common.
- Consider a token health/status endpoint or clearer setup diagnostics for first-time Lovelace configuration.

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

- Polish Lovelace card styling after testing on real Home Assistant dashboards and mobile devices.
- Add edit/delete for cabinets/rooms through Lovelace if needed.
- Consider configurable storage path if the add-on will be shared publicly.
- Consider a proper backup/restore workflow for SQLite + uploads.
