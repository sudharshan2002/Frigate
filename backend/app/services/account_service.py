"""Helpers for account-level actions backed by Supabase auth."""

from __future__ import annotations

import json
from urllib import error as urllib_error
from urllib import request as urllib_request


class AccountService:
    """Delete the currently authenticated Supabase user when admin credentials are available."""

    def __init__(self, supabase_url: str | None, service_role_key: str | None):
        self._supabase_url = (supabase_url or "").rstrip("/")
        self._service_role_key = (service_role_key or "").strip()

    @property
    def configured(self) -> bool:
        return bool(self._supabase_url and self._service_role_key)

    def delete_current_user(self, access_token: str) -> str:
        if not self.configured:
            raise RuntimeError("Account deletion is not configured on this server.")

        user = self._request_json(
            "/auth/v1/user",
            authorization=f"Bearer {access_token}",
            apikey=self._service_role_key,
        )
        user_id = user.get("id")

        if not isinstance(user_id, str) or not user_id.strip():
            raise RuntimeError("Unable to resolve the current account.")

        self._request_json(
            f"/auth/v1/admin/users/{user_id}",
            method="DELETE",
            authorization=f"Bearer {self._service_role_key}",
            apikey=self._service_role_key,
        )
        return user_id

    def _request_json(
        self,
        path: str,
        *,
        method: str = "GET",
        authorization: str,
        apikey: str,
    ) -> dict:
        request = urllib_request.Request(
            f"{self._supabase_url}{path}",
            method=method,
            headers={
                "Authorization": authorization,
                "apikey": apikey,
                "Content-Type": "application/json",
            },
        )

        try:
            with urllib_request.urlopen(request, timeout=15) as response:
                raw = response.read().decode("utf-8").strip()
        except urllib_error.HTTPError as exc:
            detail = self._extract_error_detail(exc)
            if exc.code in {401, 403}:
                raise ValueError(detail or "You need to sign in again before deleting this account.") from exc
            raise RuntimeError(detail or "Supabase could not complete the account action.") from exc
        except urllib_error.URLError as exc:
            raise RuntimeError("Unable to reach Supabase for this account action.") from exc

        if not raw:
            return {}

        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise RuntimeError("Supabase returned an unreadable account response.") from exc

        return parsed if isinstance(parsed, dict) else {}

    def _extract_error_detail(self, exc: urllib_error.HTTPError) -> str:
        try:
            raw = exc.read().decode("utf-8").strip()
        except Exception:
            return ""

        if not raw:
            return ""

        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            return raw

        if isinstance(payload, dict):
            for key in ("msg", "message", "error_description", "error"):
                value = payload.get(key)
                if isinstance(value, str) and value.strip():
                    return value.strip()

        return raw
