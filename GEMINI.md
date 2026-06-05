# BJP Keep Project Context

This file is a working memory note for future AI/dev sessions. Read it at the start of every new chat/session before answering or making changes.

IMPORTANT: Update this file every time code, config, docs, UX, packaging, or behavior changes. This is the durable memory for new chat sessions, so do not rely on the previous chat history being available.

Whenever the user asks for code/config/product changes, update this file in the same work session:

- Record what changed.
- Remove or revise any TODO/next-work items that were completed.
- Keep notes factual and useful for the next AI/dev session.
- Include enough detail that a new AI/dev session can understand the current project state without seeing older chat logs.

Also maintain release notes and versions in the same work session:

- Update `CHANGELOG.md` for every code/config/product change.
- Update `bjpkeep_ha/CHANGELOG.md` for Home Assistant add-on release notes; HA reads the add-on changelog from the add-on folder, not the repository root changelog.
- Update the add-on/app version only when `bjpkeep_ha/` add-on/app behavior changes.
- Keep `bjpkeep_ha/config.yaml`, `bjpkeep_ha/package.json`, and `bjpkeep_ha/package-lock.json` versions in sync only for add-on/app releases.
- Keep the HACS custom integration version independent in `custom_components/bjpkeep/manifest.json`. Do not bump `bjpkeep_ha/config.yaml` for integration-only changes.
- HACS displays GitHub release/tag versions. If there is no release/tag, HACS may show commit hashes as installed/latest versions even when `manifest.json` has a numeric version.
- Version rule: bug-fix-only add-on/app changes append letters to the current version, e.g. `0.5.0a`, `0.5.0b`, etc.
- Version rule: HACS custom integration `manifest.json` versions should use plain numeric semver such as `0.1.2`; avoid letter suffixes like `0.1.1a` because Home Assistant/HACS can fail to load the integration cleanly.
- Version rule: feature additions bump the minor version, e.g. `0.5.0` -> `0.6.0`, unless the user explicitly asks for a different version.

At the end of each code/config/product change, include a short git-ready summary that the user can reuse for commit/push notes.

Always include a suggested git commit message at the end of completed work. The user prefers getting this every time so they can commit quickly without asking again.

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
- `bjpkeep_ha/CHANGELOG.md`: Home Assistant-visible add-on changelog.
- `bjpkeep_ha/run.sh`: runtime setup and app start.
- `bjpkeep_ha/server.mjs`: custom Next server for HA Ingress path rewriting.

The add-on manifest includes `homeassistant_api: true` so BJP Keep can call Home Assistant Core services through the Supervisor API. This is required for direct Niimbot printing; without it, `/api/niimbot` returns `401: Unauthorized` even when the same `niimbot.print` action works from Home Assistant Developer Tools.

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

Manual fallback in the scanner now accepts Cabinet `code` instead of requiring the long cabinet id. It still accepts legacy/pasted QR payloads or cabinet URLs too. Code lookup uses `GET /api/cabinets?code=<code>`; if the same cabinet code exists in multiple rooms, the API returns `409` so the UI can ask for a less ambiguous code or a QR scan.

Helpers:

- `src/lib/cabinet-qr.ts`

QR page:

- `src/app/cabinets/[id]/qr/page.tsx`
- `src/components/cabinet-print-buttons.tsx`

Scanner:

- `src/components/qr/qr-scanner.tsx`

On iOS Home Assistant app, live `getUserMedia` did not work. The scanner now uses a single file/camera picker button and decodes the chosen photo with `jsQR`.

### Niimbot Printing

BJP Keep can print cabinet labels directly through Home Assistant's `eigger/hass-niimbot` HACS custom integration.

Config options:

```yaml
niimbot_label_device_id: ""
niimbot_qr_device_id: ""
```

`run.sh` exports these as `NIIMBOT_LABEL_DEVICE_ID` and `NIIMBOT_QR_DEVICE_ID`.

API:

- `POST /api/niimbot` with `{ "cabinetId": "...", "kind": "label" }` prints a small D110-style 40x12 label using `width: 240`, `height: 96`, and `rotate: 90`.
- `POST /api/niimbot` with `{ "cabinetId": "...", "kind": "qr" }` prints a B1-style 50x50 QR label using `width: 400`, `height: 400`.
- Niimbot label text is rendered by BJP Keep as PNG images in `src/lib/niimbot-labels.ts` and sent to `hass-niimbot` as full-label `dlimg` data URIs. This avoids Thai text rendering as square boxes from `ppb.ttf` and gives BJP Keep direct control over centered label layout.

The API calls Home Assistant via `http://supervisor/core/api/services/niimbot/print` with `SUPERVISOR_TOKEN`, so direct printing works only from BJP Keep while it is running as a Home Assistant add-on. `hass-niimbot` itself is a HACS custom integration, not an add-on. The request body must include `target: { device_id: ... }`; do not put `device_id` directly in the service data. `hass-niimbot` QR elements use `data`, not `value`.

`bjpkeep_ha/config.yaml` must keep `homeassistant_api: true`; this grants the add-on permission to use the `SUPERVISOR_TOKEN` against Home Assistant Core API service endpoints. If print requests return `{"error":"401: Unauthorized"}` from `/api/niimbot`, check that this manifest permission exists and the add-on has been rebuilt/restarted.

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

### Location And Item Deletion UX

Current deletion behavior:

- Cabinet create/update catches duplicate `code` within the same room and returns a clear `409` message instead of a generic failed-save alert.
- Room create/update catches duplicate room `code` and returns a clear `409` message.
- Cabinets can be deleted from the Locations page. Empty cabinets delete immediately after confirmation. Cabinets with items return a warning first; if the user confirms, the cabinet and all items in it are deleted.
- Rooms can be deleted from the Locations page. If the room contains cabinets or items, the UI warns with counts and requires confirmation before deleting the room, cabinets, and items.
- Item deletion now removes original images and thumbnails from disk through `src/lib/item-delete.ts`.
- Item detail deletion asks for confirmation and records a `DELETE_ITEM` activity log instead of deleting prior activity history.
- Inventory search no longer navigates while typing; it submits only on Enter/Search.
- Move Item controls use responsive sizing so long cabinet labels do not push inventory cards/page width off-screen.

### Activity User Names

Home Assistant Ingress sends user info with:

- `x-remote-user-display-name`
- `x-remote-user-name`
- `x-remote-user-id`

`src/lib/auth.ts` uses display name first, then username, then id, then cookie fallback, then `System`.

### Lovelace API, Integration, And Card

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
- `GET /api/lovelace/?resource=cabinets&includeItems=0&includeItemCounts=1` for a lightweight cabinet list with `itemCount`
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

Recommended Home Assistant integration bridge:

- `custom_components/bjpkeep/` is a HACS-installable custom integration.
- It stores the local BJP Keep API URL and Lovelace token in a HA config entry.
- It registers WebSocket commands `bjpkeep/get` and `bjpkeep/action`.
- It registers HA HTTP proxy views:
  - `/api/bjpkeep/asset?asset=bjpkeep-card.js`
  - `/api/bjpkeep/asset?asset=jsQR.js`
  - `/api/bjpkeep/image?path=<encoded upload path>`
- The asset proxy is intentionally unauthenticated because browser module scripts cannot attach HA bearer headers. It only serves static Lovelace helper files. The image proxy remains authenticated, and the card loads images with authenticated fetch-to-blob logic.
- The Lovelace cards now support two modes:
  - Integration mode: omit `api_url`; the card uses `hass.callWS(...)` and same-origin HA proxy URLs.
  - Direct fallback mode: keep `api_url` and `api_token`; the card fetches the exposed add-on port exactly as before.
- Integration mode currently supports list/search/edit/move/delete and QR scan helper loading. Photo upload still requires direct `api_url` mode until multipart proxy support is added.

Tested locally:

- `/lovelace/bjpkeep-card.js`: `200 application/javascript`, CORS `*`
- `/lovelace/jsQR.js`: `200 application/javascript`, CORS `*`
- `/api/lovelace/` without token: `401`
- `/api/lovelace/` with token: `200`

Example HA Lovelace resource:

```yaml
url: /api/bjpkeep/asset?asset=bjpkeep-card.js
type: module
```

Direct fallback Lovelace resource:

```yaml
url: http://<home-assistant-ip>:3000/lovelace/bjpkeep-card.js
type: module
```

Example card:

```yaml
type: custom:bjpkeep-card
page_size: 10
```

Direct fallback card:

```yaml
type: custom:bjpkeep-card
api_url: http://<home-assistant-ip>:3000
api_token: "same-value-as-lovelace_token"
page_size: 10
```

Optional room/cabinet filter card:

```yaml
type: custom:bjpkeep-cabinet-card
api_url: http://<home-assistant-ip>:3000
api_token: "same-value-as-lovelace_token"
title: "Rooms & Cabinets"
```

The main card currently supports all-cabinet or per-cabinet item lists, item thumbnails, cabinet selection, manual search with Search button/Enter (no auto-refresh while typing), clear/refresh controls, pagination, QR photo scan, add item with photos, edit item name, add/remove item photos, move item to another cabinet, and delete item. The optional room/cabinet filter card shows expandable rooms and sends filter events to the main card on the same dashboard view.

Current Lovelace card UX:

- The item list is compact: thumbnail, item name, and room/cabinet location only.
- Clicking an item row opens an item detail popup.
- Item rename/edit, move, add photo, remove selected photo, and delete actions live in the item detail popup instead of cluttering the list.
- Add Item opens as a popup instead of being permanently expanded in the card.
- The custom card registers `window.customCards` metadata so it can appear in Home Assistant's visual Add Card picker after the JS resource is loaded.
- `custom:bjpkeep-cabinet-card` registers separately as "BJP Keep Rooms". It displays room rows as `room name (cabinet count)`; expanding a room shows `cabinet name (item count)`. Clicking a cabinet dispatches a `bjpkeep-cabinet-filter` window event that the main card listens for and uses to update its cabinet filter.

The custom card also provides a Home Assistant visual config editor via `getConfigElement()` / `bjpkeep-card-editor`, so dashboard users can manage `api_url`, `api_token`, `title`, `page_size`, and `show_images` from the HA card editor UI after the JS resource has been added. `actor` and `cabinet_id` are intentionally hidden from the editor because actor resolves automatically from the current HA user and cabinet IDs are not practical to type manually.

Recent Lovelace card UX fixes:

- Search controls were cleaned up for narrow Home Assistant cards. The clear `x` button now sits inside the search input, and the Search/Refresh/Add item controls use a responsive grid so button text does not overflow.
- Add item now works when the card is showing `All cabinets`. The Add item popup includes its own cabinet dropdown. If a cabinet filter is already selected, that cabinet is preselected in the popup.
- The Lovelace search submit control is now an icon button inside the search field.
- The item detail popup now keeps its own current item/photo state. Adding photos updates the popup immediately, all item photos can be selected from thumbnails, and Remove Photo deletes the currently displayed photo instead of always deleting the first image.
- The Lovelace card default actor is `{{ user }}`. The custom card resolves that token itself from Home Assistant `hass.user.name`/`hass.user.id` before sending `X-BJPKeep-Actor`, because arbitrary custom card config is not Markdown-rendered by Home Assistant.
- The Lovelace visual config editor no longer exposes `actor` or `cabinet_id`; new stub configs also omit `actor` so activity logs use the current HA dashboard user by default.
- Added a second Lovelace custom card, `custom:bjpkeep-cabinet-card`, for room/cabinet navigation and filtering the main inventory card without typing cabinet IDs.
- Integration-mode Lovelace images are loaded by `public/lovelace/bjpkeep-card.js` with authenticated `fetch` calls and converted to browser blob URLs. Do not put `/api/bjpkeep/image?...` directly in `<img src>` in integration mode, because `<img>` cannot attach HA bearer headers and will return `401`.
- If Home Assistant keeps an old Lovelace card script cached after an add-on update, append a resource cache buster such as `/api/bjpkeep/asset?asset=bjpkeep-card.js&v=0.7.0d`.

Recent Docker/build fix:

- `bjpkeep_ha/Dockerfile` uses `npm ci` instead of `npm install` for deterministic image builds from `package-lock.json`.
- Docker build npm retry/timeout environment settings were added to reduce Home Assistant Supervisor build failures from slow or flaky network reads.
- Keep `package.json`, `package-lock.json`, and `config.yaml` versions in sync when bumping releases.

Recent version note:

- Add-on/app version `0.7.0d` is the current add-on release used with the optional HACS integration bridge; keep `bjpkeep_ha/config.yaml`, `bjpkeep_ha/package.json`, and `bjpkeep_ha/package-lock.json` aligned to this unless the add-on itself changes again.
- Integration compatibility fix: `custom_components/bjpkeep/config_flow.py` defines `CONF_NAME = "name"` locally instead of importing it from `homeassistant.const`, avoiding HA-version-specific import failures.
- HACS integration version is independent and currently uses `custom_components/bjpkeep/manifest.json` version `0.1.5`.
- Integration config-flow fix: the default API URL is now blank instead of the user's personal LAN IP, and the form validates that the value is a full `http://` or `https://` URL before testing the connection.
- Lovelace troubleshooting note: if the browser Network tab shows `http://<private-ip>:3000/lovelace/bjpkeep-card.js`, Home Assistant is still using the direct fallback resource. Replace/delete that dashboard resource and use `/api/bjpkeep/asset?asset=bjpkeep-card.js` for same-origin integration mode.
- Integration asset proxy fix: `BjpKeepAssetView.requires_auth` is `False` so `/api/bjpkeep/asset?asset=bjpkeep-card.js` can load as a Lovelace JavaScript module. If both custom elements disappear with "Custom element doesn't exist", first verify this endpoint returns JavaScript instead of 401.
- Integration compatibility fix: Home Assistant 2026 expects `@websocket_api.websocket_command(...)` to receive a schema dict, not `vol.Schema(...)`; using `vol.Schema(...)` caused `AttributeError: 'Schema' object has no attribute 'validators'` and prevented the config flow from loading.
- Integration load fix: signed image proxy changes from `0.1.2` were reverted in `0.1.3` because the integration stopped appearing in Add Integration. Image requests may still need a separate fix after checking real Home Assistant logs.
- For HACS to show numeric versions instead of commit hashes, publish a GitHub release/tag for the integration. Without releases/tags, HACS can show short commit SHAs as installed/latest versions.
- Version `0.6.0b` adds the required `homeassistant_api: true` add-on permission for direct Niimbot service calls and adds `bjpkeep_ha/CHANGELOG.md` so Home Assistant can show update notes. `0.6.0a` contained the Niimbot service payload/target fixes.

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
- HACS-ready Home Assistant custom integration bridge for Lovelace same-origin proxying.
- Add-on icon/logo files exist at add-on root.
- Lovelace item API supports pagination and lightweight cabinet fetches for large inventories.
- Lovelace card/API supports photo upload while adding an item, adding photos to an existing item, and deleting an item photo.
- Lovelace card has a visual Home Assistant config editor and stub config for UI-based card creation/editing.
- Lovelace card registers custom-card metadata for Home Assistant's visual Add Card picker.
- Lovelace room/cabinet filter card registers custom-card metadata for Home Assistant's visual Add Card picker.
- Lovelace card uses compact item rows with click-to-open item detail popup.
- Lovelace Add Item form opens in a popup.
- Lovelace Add Item popup can create an item from `All cabinets` by selecting a cabinet in the popup.
- Lovelace search controls are responsive; clear search is an inline `x` inside the input.
- Lovelace item detail popup supports multi-photo thumbnails and deletes the currently selected/displayed photo.
- Root `README.md` documents the full Home Assistant installation flow, add-on configuration, Lovelace resource/card setup, test URLs, and troubleshooting.

## Known Caveats

- HA Ingress add-on UI is admin-only in Home Assistant. Lovelace card is the workaround for non-admin dashboard users.
- Recommended Lovelace setup uses the BJP Keep HA integration bridge; direct fallback mode still talks to exposed port `3000`, not HA Ingress.
- If HA is served over HTTPS and direct fallback card API is HTTP, browser mixed-content policies may matter.
- `LOVELACE_API_TOKEN` must be set or `/api/lovelace/` returns 401.
- If the Lovelace card shows repeated `/api/lovelace/?resource=cabinets` 401 errors, the dashboard card config is missing `api_token`, the token does not match `lovelace_token`, or the add-on was not restarted after changing the token.
- The Lovelace JS resource still has to be added to HA resources before the visual card editor can appear.
- Integration mode depends on installing/configuring `custom_components/bjpkeep`; without that, omit `api_url` mode will show a BJP Keep integration readiness error.
- Integration mode photo upload is not implemented yet; use direct fallback mode for photo upload until multipart proxy support is added.
- Runtime paths are currently personal/setup-specific (`/share/HAShare/...`).
- Build emits a recurring Turbopack warning about upload/thumb route tracing. Builds still pass.

## Suggested Next Lovelace Work

- Add an optional read-only dashboard summary mode.
- Add multipart upload proxy support to the BJP Keep HA integration so photo upload works in integration mode.
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
