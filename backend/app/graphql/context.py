"""Per-request GraphQL context: which guest (if any) is asking."""

import uuid

from fastapi import Request
from strawberry.fastapi import BaseContext

from app.auth.guest import read_pass


class NotSignedIn(Exception):
    def __init__(self) -> None:
        super().__init__("Enter the password to do this.")


class NotAllowed(Exception):
    def __init__(self, message: str = "This view can't do that.") -> None:
        super().__init__(message)


class Context(BaseContext):
    def __init__(self, request: Request) -> None:
        super().__init__()
        self.request = request
        header = request.headers.get("authorization", "")
        scheme, _, token = header.partition(" ")
        self.guest_id: uuid.UUID | None = (
            read_pass(token) if scheme.lower() == "bearer" and token else None
        )

    def require_guest(self) -> uuid.UUID:
        if self.guest_id is None:
            raise NotSignedIn()
        return self.guest_id


async def get_context(request: Request) -> Context:
    return Context(request)
