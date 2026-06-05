"""Home Assistant integration bridge for BJP Keep."""

from __future__ import annotations

from typing import Any
from urllib.parse import quote

import voluptuous as vol
from aiohttp import web

from homeassistant.components import websocket_api
from homeassistant.components.http import HomeAssistantView
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import (
    CONF_API_TOKEN,
    CONF_API_URL,
    DOMAIN,
    HTTP_ASSET_PATH,
    HTTP_IMAGE_PATH,
    WS_ACTION,
    WS_GET,
)

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up BJP Keep from a config entry."""

    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = {
        CONF_API_URL: entry.data[CONF_API_URL].rstrip("/"),
        CONF_API_TOKEN: entry.data[CONF_API_TOKEN],
    }
    _register_bridge(hass)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a BJP Keep config entry."""

    hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    return True


def _register_bridge(hass: HomeAssistant) -> None:
    """Register BJP Keep Home Assistant proxy endpoints once."""

    hass.data.setdefault(DOMAIN, {})
    if hass.data[DOMAIN].get("registered"):
        return

    websocket_api.async_register_command(hass, _ws_get)
    websocket_api.async_register_command(hass, _ws_action)
    hass.http.register_view(BjpKeepImageView)
    hass.http.register_view(BjpKeepAssetView)
    hass.data[DOMAIN]["registered"] = True


def _get_config(hass: HomeAssistant) -> dict[str, str]:
    """Return the active BJP Keep config."""

    configs = [
        value
        for key, value in hass.data.get(DOMAIN, {}).items()
        if key != "registered"
    ]
    if not configs:
        raise web.HTTPNotFound(text="BJP Keep is not configured")
    return configs[0]


def _headers(config: dict[str, str], actor: str | None = None) -> dict[str, str]:
    """Build headers for BJP Keep API calls."""

    headers = {
        "Authorization": f"Bearer {config[CONF_API_TOKEN]}",
    }
    if actor:
        headers["X-BJPKeep-Actor"] = actor
    return headers


def _image_proxy_url(path: str | None) -> str | None:
    """Convert a BJP Keep upload path to a Home Assistant authenticated URL."""

    if not path or not path.startswith("/uploads/"):
        return path
    return f"{HTTP_IMAGE_PATH}?path={quote(path, safe='')}"


def _rewrite_image_urls(value: Any) -> Any:
    """Rewrite nested item image paths so Lovelace loads images via Home Assistant."""

    if isinstance(value, list):
        return [_rewrite_image_urls(item) for item in value]
    if isinstance(value, dict):
        rewritten = {key: _rewrite_image_urls(item) for key, item in value.items()}
        if "path" in rewritten:
            rewritten["haPath"] = _image_proxy_url(rewritten.get("path"))
        if "thumbnailPath" in rewritten:
            rewritten["haThumbnailPath"] = _image_proxy_url(rewritten.get("thumbnailPath"))
        return rewritten
    return value


async def _request_json(
    hass: HomeAssistant,
    method: str,
    path: str,
    *,
    params: dict[str, Any] | None = None,
    json_data: dict[str, Any] | None = None,
    actor: str | None = None,
) -> Any:
    """Send a JSON request to the BJP Keep add-on."""

    config = _get_config(hass)
    session = async_get_clientsession(hass)
    url = f"{config[CONF_API_URL]}{path}"

    async with session.request(
        method,
        url,
        params=params,
        json=json_data,
        headers=_headers(config, actor),
        timeout=30,
    ) as response:
        data = await response.json(content_type=None)
        if response.status >= 400:
            raise web.HTTPBadGateway(
                text=data.get("error", "BJP Keep request failed")
                if isinstance(data, dict)
                else "BJP Keep request failed"
            )
        return _rewrite_image_urls(data)


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_GET,
        vol.Optional("resource", default="summary"): str,
        vol.Optional("resource_id"): str,
        vol.Optional("q"): str,
        vol.Optional("cabinetId"): str,
        vol.Optional("page"): int,
        vol.Optional("pageSize"): int,
        vol.Optional("includeItems"): vol.Any(str, int),
        vol.Optional("includeItemCounts"): vol.Any(str, int),
    }
)
@callback
def _ws_get(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Handle a BJP Keep GET command."""

    async def _handle() -> None:
        try:
            params = {key: value for key, value in msg.items() if key not in {"id", "type", "resource_id"}}
            if "resource_id" in msg:
                params["id"] = msg["resource_id"]
            result = await _request_json(hass, "GET", "/api/lovelace/", params=params)
            connection.send_result(msg["id"], result)
        except Exception as err:
            connection.send_error(msg["id"], "bjpkeep_error", str(err))

    hass.async_create_task(_handle())


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_ACTION,
        vol.Required("action"): str,
        vol.Optional("id"): str,
        vol.Optional("name"): str,
        vol.Optional("cabinetId"): str,
        vol.Optional("imageId"): str,
        vol.Optional("actor"): str,
    }
)
@callback
def _ws_action(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Handle a BJP Keep JSON action command."""

    async def _handle() -> None:
        try:
            payload = {key: value for key, value in msg.items() if key not in {"id", "type", "actor"}}
            result = await _request_json(
                hass,
                "POST",
                "/api/lovelace/",
                json_data=payload,
                actor=msg.get("actor"),
            )
            connection.send_result(msg["id"], result)
        except Exception as err:
            connection.send_error(msg["id"], "bjpkeep_error", str(err))

    hass.async_create_task(_handle())


class BjpKeepImageView(HomeAssistantView):
    """Proxy BJP Keep upload files through Home Assistant auth."""

    url = HTTP_IMAGE_PATH
    name = "api:bjpkeep:image"
    requires_auth = True

    async def get(self, request: web.Request) -> web.StreamResponse:
        """Return an upload file from BJP Keep."""

        hass = request.app["hass"]
        path = request.query.get("path", "")
        if not path.startswith("/uploads/"):
            raise web.HTTPBadRequest(text="Invalid image path")
        return await _proxy_bytes(hass, path)


class BjpKeepAssetView(HomeAssistantView):
    """Proxy BJP Keep Lovelace helper assets."""

    url = HTTP_ASSET_PATH
    name = "api:bjpkeep:asset"
    requires_auth = False

    async def get(self, request: web.Request) -> web.StreamResponse:
        """Return a Lovelace helper asset from BJP Keep."""

        hass = request.app["hass"]
        asset = request.query.get("asset", "")
        if asset not in {"bjpkeep-card.js", "jsQR.js"}:
            raise web.HTTPBadRequest(text="Invalid asset")
        return await _proxy_bytes(hass, f"/lovelace/{asset}")


async def _proxy_bytes(hass: HomeAssistant, path: str) -> web.Response:
    """Proxy a non-JSON response from BJP Keep."""

    config = _get_config(hass)
    session = async_get_clientsession(hass)
    async with session.get(
        f"{config[CONF_API_URL]}{path}",
        headers=_headers(config),
        timeout=30,
    ) as response:
        if response.status >= 400:
            raise web.HTTPBadGateway(text="BJP Keep proxy request failed")
        body = await response.read()
        return web.Response(
            body=body,
            headers={"content-type": response.headers.get("content-type", "application/octet-stream")},
        )
