# BJP Keep Home Assistant Add-on

BJP Keep is a private home inventory app for tracking where household items are stored. It runs as a Home Assistant add-on and can also expose a Lovelace dashboard card for non-admin dashboard users.

This guide is written as a future reminder from the first Home Assistant setup step onward.

## What You Need

- Home Assistant with the Supervisor/Add-on Store.
- A `/share/HAShare` folder mounted and writable by Home Assistant.
- This add-on repository URL:

```text
https://github.com/batty211/bjpkeep
```

Current storage paths are personal/setup-specific:

```text
/share/HAShare/bjpkeep/bjpkeep.db
/share/HAShare/bjpkeep/uploads/items
```

If `/share/HAShare` does not exist, the add-on will stop at startup. Create or mount that share first.

## Install The Add-on Repository

1. Open Home Assistant.
2. Go to `Settings` > `Add-ons`.
3. Open the three-dot menu in the top right.
4. Choose `Repositories`.
5. Paste this URL:

```text
https://github.com/batty211/bjpkeep
```

6. Click `Add`.
7. Close the repositories dialog.
8. Find `BJP Keep` in the Add-on Store.
9. Open it and click `Install`.

## Configure The Add-on

Open the `Configuration` tab for the BJP Keep add-on.

Recommended starting config:

```yaml
log_level: info
app_url: ""
lovelace_token: "choose-a-long-private-token"
niimbot_label_device_id: ""
niimbot_qr_device_id: ""
dev_mode: false
```

Notes:

- `lovelace_token` is required for the Lovelace API/card. Use the same value later as `api_token` in the dashboard card.
- Leave `app_url` empty unless a specific external app URL is needed.
- The add-on exposes port `3000/tcp` for Lovelace usage.
- `niimbot_label_device_id` is optional. Set it to the Home Assistant device id for a small label printer such as Niimbot D110.
- `niimbot_qr_device_id` is optional. Set it to the Home Assistant device id for a larger QR label printer such as Niimbot B1.
- Restart the add-on after changing `lovelace_token` or Niimbot printer settings.

## Start BJP Keep

1. Open the `Info` tab.
2. Enable `Start on boot` if desired.
3. Click `Start`.
4. Open `Log` and confirm startup succeeded.
5. Click `Open Web UI`.

Inside the app:

1. Create rooms.
2. Create cabinets inside rooms.
3. Print or save cabinet QR codes from each cabinet QR page.
4. Add items to cabinets.

If the Home Assistant `eigger/hass-niimbot` HACS custom integration is installed and the device ids above are configured, each cabinet QR page can send a small 40x12 label or a 50x50 QR label directly to `niimbot.print`.

Cabinet QR codes use permanent payloads like:

```text
bjpkeep:cabinet:<cabinetId>
```

They do not depend on Home Assistant Ingress URLs or temporary tokens.

## Add The Home Assistant Integration

The recommended Lovelace setup is to install the BJP Keep Home Assistant integration. The integration lets dashboard cards talk to Home Assistant first, then Home Assistant proxies requests to the BJP Keep add-on over your local network. This avoids public domains, Cloudflare Tunnel hostnames, mixed-content problems, and `api_url` changes when your external domain changes.

### Install With HACS

1. Open HACS.
2. Open the three-dot menu.
3. Choose `Custom repositories`.
4. Add this repository URL.
5. Set category to `Integration`.
6. Click `Add`.
7. Install `BJP Keep`.
8. Restart Home Assistant.

HACS uses GitHub releases/tags for the installed/latest version labels. If this repository has no release/tag yet, HACS may show short commit hashes instead of numeric versions. Create a GitHub release such as `v0.1.0` after publishing integration changes if you want HACS to show a normal version number.

After restart:

1. Go to `Settings` > `Devices & services`.
2. Click `Add Integration`.
3. Search for `BJP Keep`.
4. Set `BJP Keep local API URL` to the add-on URL that Home Assistant can reach, for example:

```text
http://<home-assistant-ip>:3000
```

5. Set `Lovelace token` to the same value as the add-on `lovelace_token`.

This URL is used by Home Assistant itself, not by the browser. It can stay as your local LAN URL even when you open Home Assistant through Cloudflare Tunnel, Nabu Casa, or a changed public domain.

Useful SSH checks:

```bash
cat /config/custom_components/bjpkeep/manifest.json
ha core logs | grep -i bjpkeep
```

In integration mode, item images are served through Home Assistant's authenticated `/api/bjpkeep/image` proxy. The Lovelace card loads those images with authenticated fetch calls and displays them as browser blob URLs, because plain `<img>` tags cannot attach Home Assistant bearer headers.

## Lovelace Card Loading

The add-on UI opened through Ingress is admin-only in Home Assistant. To let dashboard users interact with BJP Keep, use the Lovelace custom card.

When the BJP Keep Home Assistant integration is installed and configured, it automatically registers the Lovelace card JavaScript with Home Assistant's frontend:

```text
/api/bjpkeep/asset?asset=bjpkeep-card.js&v=<integration-version>
```

You do not need to add this resource manually in integration mode. The integration exposes this card asset endpoint without Home Assistant bearer-header auth because browser module scripts cannot attach those headers; it only serves the static `bjpkeep-card.js` and `jsQR.js` helper files.

If you previously added a manual BJP Keep resource, remove it from `Settings` > `Dashboards` > `Resources` so Home Assistant does not keep loading an old direct fallback URL.

Direct fallback mode still requires a manual resource. Use the Home Assistant host/IP and exposed add-on port:

```text
http://<home-assistant-ip>:3000/lovelace/bjpkeep-card.js
```

Direct fallback mode is useful only if you are not using the Home Assistant integration bridge.

To add a direct fallback resource manually:

1. Go to `Settings` > `Dashboards`.
2. Open the three-dot menu.
3. Choose `Resources`.
4. Click `Add Resource`.
5. Set URL to:

```text
http://<home-assistant-ip>:3000/lovelace/bjpkeep-card.js
```

6. Set resource type to `JavaScript Module`.
7. Save.
8. Refresh the browser or reload the Home Assistant app.

## Add The Card To A Dashboard

After the integration is loaded, BJP Keep should appear in Home Assistant's visual Add Card picker as a custom card.

If it does not appear, add it manually:

```yaml
type: custom:bjpkeep-card
title: "BJP Keep"
page_size: 10
show_images: true
```

Leave `api_url` and `api_token` out when using the BJP Keep Home Assistant integration.

Direct fallback mode:

```yaml
type: custom:bjpkeep-card
api_url: http://<home-assistant-ip>:3000
api_token: "same-value-as-lovelace_token"
title: "BJP Keep"
page_size: 10
show_images: true
```

The card automatically uses Home Assistant's current dashboard user in activity logs.

Optional room/cabinet filter card:

```yaml
type: custom:bjpkeep-cabinet-card
title: "Rooms & Cabinets"
```

Direct fallback mode for the room/cabinet card also supports `api_url` and `api_token`.

Place it on the same dashboard view as the main BJP Keep card. Click a room to expand its cabinets, then click a cabinet to filter the main card.

Card behavior:

- Select all cabinets or a specific cabinet.
- Search items manually with Search or Enter.
- Scan a cabinet QR photo.
- Add Item opens as a popup.
- The item list is compact: thumbnail, item name, and room/cabinet.
- Click an item row to open a detail popup.
- The detail popup supports rename, move, add photo, remove selected photo, and delete.
- The optional room/cabinet card shows `room name (cabinet count)` and `cabinet name (item count)` and filters the main card when a cabinet is selected.

Photo upload currently requires direct fallback mode because multipart upload proxying through Home Assistant is not implemented yet. List/search/edit/move/delete work through the integration.

## Test URLs

Use these from a browser on the same network:

```text
http://<home-assistant-ip>:3000/lovelace/bjpkeep-card.js
http://<home-assistant-ip>:3000/lovelace/jsQR.js
```

The API should return `401` without a token:

```text
http://<home-assistant-ip>:3000/api/lovelace/
```

With token:

```text
http://<home-assistant-ip>:3000/api/lovelace/?token=same-value-as-lovelace_token
```

After installing the Home Assistant integration, the card resource should load through Home Assistant automatically:

```text
https://<home-assistant-host>/api/bjpkeep/asset?asset=bjpkeep-card.js&v=<integration-version>
```

## Troubleshooting

If the add-on will not start:

- Confirm `/share/HAShare` exists and is mounted.
- Check the add-on log for Prisma/database write errors.
- Confirm Home Assistant can write to `/share/HAShare/bjpkeep`.

If the Lovelace card shows `401`:

- Confirm `lovelace_token` is set in the add-on config.
- Restart the add-on after setting/changing the token.
- Confirm the card `api_token` exactly matches `lovelace_token`.

If the card resource does not load:

- In integration mode, confirm the BJP Keep integration is configured under `Settings` > `Devices & services`.
- If the browser Network tab shows `http://<private-ip>:3000/lovelace/bjpkeep-card.js`, Home Assistant is still using a manual direct fallback resource. Delete that resource, then refresh the browser or restart the Home Assistant app.
- In direct fallback mode, confirm the resource URL uses port `3000`.
- In direct fallback mode, confirm the URL is reachable from the same device/browser running Home Assistant.
- Hard refresh the browser or restart the Home Assistant mobile app.
- If Home Assistant is served over HTTPS but the card API is HTTP, browser mixed-content rules may block requests.

If item photos are slow or missing:

- New uploads create thumbnails automatically.
- Old uploads may generate thumbnails lazily on first request.
- Original images are still used on item detail pages for quality.

## Development Notes

The app source is in `bjpkeep_ha/`.

Useful local commands:

```bash
cd bjpkeep_ha
npm install
npm run dev
npm run build
```

Local production-style test:

```bash
cd bjpkeep_ha
PORT=3003 LOVELACE_API_TOKEN=testtoken npm start
```

Then open:

```text
http://127.0.0.1:3003/
http://127.0.0.1:3003/lovelace/bjpkeep-card.js
```
