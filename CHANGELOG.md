# Changelog

## 0.8.0a

- Added a clearer Niimbot connection error explaining that the mobile NIIMBOT app or another Bluetooth client must be disconnected before Home Assistant can print.

## Documentation

- Reworked the root README into a more user-facing setup guide, with internal maintainer/release notes separated from normal installation and dashboard setup steps.

## HACS integration 0.2.1

- Added Home Assistant/HACS brand assets so BJP Keep can show its icon/logo instead of "icon not available" on supported Home Assistant versions.
- Added HACS-required metadata to the integration manifest, including issue tracker and code owner.
- Added an integration-local changelog and release notes guidance so HACS update dialogs can show useful changelogs when GitHub Releases are published.

## 0.8.0 / HACS integration 0.2.0

- Added an authenticated Home Assistant multipart action proxy at `/api/bjpkeep/action` so integration-mode Lovelace users can create items with photos and add photos to existing items.
- Updated the Lovelace card to send photo upload `FormData` through the Home Assistant integration bridge when `api_url` is omitted.
- Rewrites uploaded item image URLs returned from multipart actions to Home Assistant image proxy URLs so newly uploaded photos appear immediately in the card.

## 0.7.0e / HACS integration 0.1.8

- Fixed Home Assistant integration-mode Lovelace actions failing before they reached the BJP Keep API because the integration reused the WebSocket command `id` field for item IDs.
- Updated the Lovelace card bridge payload to send item IDs as `item_id` in integration mode, keeping create/edit/move/delete actions separate from Home Assistant's internal WebSocket command IDs.

## HACS integration 0.1.7

- Creates or updates the actual Home Assistant Dashboard Resource entry for the BJP Keep Lovelace card when the integration is configured.
- Replaces old BJP Keep card resource URLs, including direct fallback `/lovelace/bjpkeep-card.js` resources, with the same-origin `/api/bjpkeep/asset?asset=bjpkeep-card.js&v=0.1.7` module URL in Lovelace storage mode.
- Keeps the frontend global module registration as a fallback, while making the resource visible under Dashboard Resources like HACS frontend cards.

## HACS integration 0.1.6

- Automatically registers the BJP Keep Lovelace card module with Home Assistant's frontend when the integration is configured, so integration-mode users no longer need to add a Dashboard Resource manually.
- Removes the auto-registered frontend module URL when the last BJP Keep config entry is unloaded.
- Updated Lovelace setup docs to treat manual dashboard resources as direct fallback mode only.

## HACS integration 0.1.5

- Removed the personal LAN IP from the integration's default API URL so new config flows require an explicit local add-on URL.
- Added config-flow validation for empty or non-HTTP(S) API URLs.
- Documented that a browser request to `http://<private-ip>:3000/lovelace/bjpkeep-card.js` means Home Assistant is still using the direct fallback Lovelace resource instead of the same-origin integration resource.

## HACS integration 0.1.4

- Fixed Lovelace custom elements not registering through the Home Assistant integration by allowing the static card assets endpoint to load without Home Assistant bearer headers. The asset proxy only serves `bjpkeep-card.js` and `jsQR.js`; data APIs and image proxy routes remain authenticated.

## 0.7.0d

- Fixed Lovelace images in Home Assistant integration mode by loading authenticated image proxy responses as browser blob URLs instead of assigning authenticated API URLs directly to `<img>` tags.

## HACS integration 0.1.3

- Restored Home Assistant integration loading by reverting the signed image proxy change that could prevent BJP Keep from appearing in Add Integration.

## HACS integration 0.1.2

- Attempted to fix Lovelace item image `401 Unauthorized` responses with signed image proxy URLs. This was reverted in `0.1.3` because it could prevent the custom integration from loading.

## HACS integration 0.1.1

- Fixed Home Assistant 2026 WebSocket command schema registration so the custom integration can import and the config flow can load.

## 0.7.0c

- Kept the Home Assistant add-on release version aligned with the currently installed `0.7.0c` add-on while leaving the HACS integration version independent.
- Removed a config flow import dependency on `homeassistant.const.CONF_NAME` for better Home Assistant compatibility.

## 0.7.0

- Added a BJP Keep Home Assistant custom integration for HACS installs.
- Added Home Assistant WebSocket/API proxy support so Lovelace cards can work without public `api_url` configuration.
- Updated Lovelace cards to keep direct `api_url` mode as a fallback while supporting integration mode when `api_url` is omitted.
- Documented the recommended HACS integration flow and same-origin Lovelace resource URL.
- Kept the HACS integration version independent from the Home Assistant add-on version.

## 0.6.0c

- Fixed Niimbot cabinet label rendering by sending app-generated PNG label images, improving centering and Thai text support.

## 0.6.0b

- Added Home Assistant API permission for direct Niimbot service calls from the add-on.
- Added an add-on-local changelog so Home Assistant can show update notes.

## 0.6.0a

- Fixed Niimbot print service calls to send Home Assistant target data in the expected format.
- Fixed QR payload element data field for `hass-niimbot`.

## 0.6.0

- Added Niimbot direct printing support from cabinet QR pages.
- Added add-on config for small label and QR label Niimbot device IDs.
- Added Cabinet Code fallback on the scan page so users do not need to type long cabinet IDs.
- Added cabinet lookup by code and safer cabinet auto-code generation.

## 0.5.0

- Added clearer duplicate cabinet/room code errors.
- Added Cabinet and Room delete flows with confirmation when nested items exist.
- Fixed inventory search so typing no longer refreshes the page.
- Fixed responsive overflow issues in Inventory move controls and item detail pages.
- Added delete confirmation and activity logging on item detail deletion.
