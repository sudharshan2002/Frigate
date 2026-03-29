"""Simple script to run the backend on your machine."""

from __future__ import annotations

import uvicorn


if __name__ == "__main__":
    from config import get_settings

    settings = get_settings()
    uvicorn.run(
        "app.main:create_app",
        factory=True,
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
    )
