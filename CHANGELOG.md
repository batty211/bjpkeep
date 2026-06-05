# Changelog

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
