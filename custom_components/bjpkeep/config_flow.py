"""Config flow for BJP Keep."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.const import CONF_NAME
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import CONF_API_TOKEN, CONF_API_URL, DEFAULT_API_URL, DOMAIN


class ConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a BJP Keep config flow."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        """Create a BJP Keep config entry."""

        errors: dict[str, str] = {}

        if user_input is not None:
            api_url = str(user_input[CONF_API_URL]).rstrip("/")
            api_token = str(user_input[CONF_API_TOKEN])

            try:
                await self._test_connection(api_url, api_token)
            except CannotConnect:
                errors["base"] = "cannot_connect"
            except InvalidAuth:
                errors["base"] = "invalid_auth"
            except Exception:
                errors["base"] = "unknown"
            else:
                await self.async_set_unique_id(DOMAIN)
                self._abort_if_unique_id_configured(
                    updates={
                        CONF_API_URL: api_url,
                        CONF_API_TOKEN: api_token,
                    }
                )
                return self.async_create_entry(
                    title=user_input.get(CONF_NAME, "BJP Keep"),
                    data={
                        CONF_API_URL: api_url,
                        CONF_API_TOKEN: api_token,
                    },
                )

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Optional(CONF_NAME, default="BJP Keep"): str,
                    vol.Required(CONF_API_URL, default=DEFAULT_API_URL): str,
                    vol.Required(CONF_API_TOKEN): str,
                }
            ),
            errors=errors,
        )

    async def _test_connection(self, api_url: str, api_token: str) -> None:
        """Verify that the configured API endpoint is reachable."""

        session = async_get_clientsession(self.hass)
        url = f"{api_url}/api/lovelace/"
        headers = {"Authorization": f"Bearer {api_token}"}

        async with session.get(url, headers=headers, timeout=10) as response:
            if response.status == 401:
                raise InvalidAuth
            if response.status >= 400:
                raise CannotConnect
            await response.json()


class CannotConnect(Exception):
    """Raised when BJP Keep cannot be reached."""


class InvalidAuth(Exception):
    """Raised when the configured token is invalid."""
