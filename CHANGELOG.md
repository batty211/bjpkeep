# Changelog

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
