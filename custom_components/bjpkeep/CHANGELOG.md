# BJP Keep Integration Changelog

## 0.2.1

- Added local brand assets for Home Assistant/HACS so BJP Keep no longer shows "icon not available" on supported Home Assistant versions.
- Added HACS-required integration metadata, including issue tracker and code owner.
- Documented the release/tag flow needed for HACS to show version numbers and update changelogs.

## 0.2.0

- Added an authenticated Home Assistant multipart action proxy at `/api/bjpkeep/action`.
- Enabled integration-mode Lovelace users to create items with photos and add photos to existing items.
- Rewrote uploaded item image URLs returned from multipart actions to Home Assistant image proxy URLs so new photos appear immediately.

## 0.1.8

- Fixed Home Assistant integration-mode Lovelace actions failing before they reached the BJP Keep API because the integration reused the WebSocket command `id` field for item IDs.
- Updated the Lovelace card bridge payload to send item IDs as `item_id` in integration mode.

## 0.1.7

- Created or updated the actual Home Assistant Dashboard Resource entry for the BJP Keep Lovelace card when the integration is configured.
- Replaced old BJP Keep card resource URLs with the same-origin `/api/bjpkeep/asset?asset=bjpkeep-card.js` module URL in Lovelace storage mode.

