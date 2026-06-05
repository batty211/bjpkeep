# Changelog

## 0.8.0

- Added integration-mode Lovelace photo upload support through the authenticated Home Assistant multipart action proxy.

## 0.7.0e

- Fixed the Lovelace card bridge payload so item IDs no longer conflict with Home Assistant WebSocket command IDs in integration mode.

## 0.7.0d

- Fixed Lovelace images in Home Assistant integration mode by loading authenticated image proxy responses as browser blob URLs instead of assigning authenticated API URLs directly to `<img>` tags.

## 0.7.0c

- Current add-on release used with the optional HACS Home Assistant integration bridge.

## 0.7.0

- Added support for the optional BJP Keep Home Assistant integration bridge.
- Updated Lovelace cards to work without direct `api_url` when the integration is installed.
- Kept direct exposed-port Lovelace mode available as a fallback.

## 0.6.0c

- Fixed Niimbot cabinet label rendering by sending app-generated PNG label images, improving centering and Thai text support.

## 0.6.0b

- Added Home Assistant API permission for direct Niimbot service calls from the add-on.
- Added this add-on-local changelog so Home Assistant can show update notes.

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
