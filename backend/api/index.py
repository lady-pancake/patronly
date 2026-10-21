"""Vercel entry point: Vercel serves the ASGI `app` exported from this file."""

from app.main import app

__all__ = ["app"]
