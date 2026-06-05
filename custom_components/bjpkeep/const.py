"""Constants for the BJP Keep integration."""

DOMAIN = "bjpkeep"

CONF_API_URL = "api_url"
CONF_API_TOKEN = "api_token"

DEFAULT_API_URL = "http://192.168.1.222:3000"

WS_GET = f"{DOMAIN}/get"
WS_ACTION = f"{DOMAIN}/action"

HTTP_IMAGE_PATH = f"/api/{DOMAIN}/image"
HTTP_ASSET_PATH = f"/api/{DOMAIN}/asset"
