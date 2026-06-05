"""Constants for the BJP Keep integration."""

DOMAIN = "bjpkeep"
VERSION = "0.2.0"

CONF_API_URL = "api_url"
CONF_API_TOKEN = "api_token"

DEFAULT_API_URL = ""

WS_GET = f"{DOMAIN}/get"
WS_ACTION = f"{DOMAIN}/action"

HTTP_IMAGE_PATH = f"/api/{DOMAIN}/image"
HTTP_ASSET_PATH = f"/api/{DOMAIN}/asset"
HTTP_ACTION_PATH = f"/api/{DOMAIN}/action"
LOVELACE_CARD_ASSET = "bjpkeep-card.js"
LOVELACE_CARD_RESOURCE_PREFIX = f"{HTTP_ASSET_PATH}?asset={LOVELACE_CARD_ASSET}"
LOVELACE_CARD_URL = f"{LOVELACE_CARD_RESOURCE_PREFIX}&v={VERSION}"
