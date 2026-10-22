"""Guest access: the password gate, the current guest, and what each view may do.

Only the visit itself is stored. The guest's chosen view, favourites and
messages live in their browser tab; the backend's job is to say which actions
each view allows, so the frontend checks actions rather than roles.
"""

import asyncio
from enum import Enum

import strawberry
from sqlalchemy import func, update

from app.auth import entitlements as ent
from app.auth.guest import check_password, issue_pass
from app.db import session as db
from app.db.models import Guest
from app.graphql.context import Context, NotAllowed
from app.text import clean_text


@strawberry.enum
class Role(Enum):
    PATRON = "patron"
    ARTIST = "artist"


Entitlement = strawberry.enum(ent.Entitlement, description="Something a view may do.")


@strawberry.type
class RoleActions:
    role: Role
    entitlements: list[Entitlement]


def role_actions() -> list[RoleActions]:
    return [RoleActions(role=r, entitlements=sorted(ent.entitlements_for(r.value))) for r in Role]


@strawberry.type
class Viewer:
    id: strawberry.ID
    name: str
    roles: list[RoleActions] = strawberry.field(
        description="The views this guest can switch between, each with the actions it allows."
    )

    @classmethod
    def from_guest(cls, g: Guest) -> "Viewer":
        return cls(id=strawberry.ID(str(g.id)), name=g.name, roles=role_actions())


@strawberry.type
class GuestPass:
    token: str = strawberry.field(description="Send as `Authorization: Bearer <token>`.")
    viewer: Viewer


@strawberry.type
class ViewerQuery:
    @strawberry.field(description="What each view may do. Public: used to skip the gate locally.")
    def role_actions(self) -> list[RoleActions]:
        return role_actions()

    @strawberry.field(description="The current guest, or null without a valid guest pass.")
    async def me(self, info: strawberry.Info[Context, None]) -> Viewer | None:
        if info.context.guest_id is None:
            return None
        async for session in db.get_session():
            guest = await session.scalar(
                update(Guest)
                .where(Guest.id == info.context.guest_id)
                .values(last_seen_at=func.now())
                .returning(Guest)
            )
            await session.commit()
            return Viewer.from_guest(guest) if guest else None
        return None


@strawberry.type
class ViewerMutation:
    @strawberry.mutation(description="Pass the portfolio password gate. Logs the visit.")
    async def start_visit(
        self, info: strawberry.Info[Context, None], name: str, password: str
    ) -> GuestPass:
        name = clean_text(" ".join(name.split())[:120])
        if not name:
            raise ValueError("Please tell us your name.")
        if not check_password(password):
            await asyncio.sleep(0.5)  # Slows down guessing.
            raise NotAllowed("That password isn't right.")
        user_agent = (info.context.request.headers.get("user-agent") or "")[:500] or None
        async for session in db.get_session():
            guest = Guest(name=name, user_agent=user_agent)
            session.add(guest)
            await session.commit()
            return GuestPass(token=issue_pass(guest.id), viewer=Viewer.from_guest(guest))
        raise RuntimeError("unreachable")
