"""Constants for the BJP Keep integration."""

DOMAIN = "bjpkeep"
VERSION = "0.1.6"

CONF_API_URL = "api_url"
CONF_API_TOKEN = "api_token"

DEFAULT_API_URL = ""

WS_GET = f"{DOMAIN}/get"
WS_ACTION = f"{DOMAIN}/action"

HTTP_IMAGE_PATH = f"/api/{DOMAIN}/image"
HTTP_ASSET_PATH = f"/api/{DOMAIN}/asset"
LOVELACE_CARD_URL = f"{HTTP_ASSET_PATH}?asset=bjpkeep-card.js&v={VERSION}"
