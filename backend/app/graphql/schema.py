import uuid
from datetime import datetime

import strawberry
from sqlalchemy import select

from app import __version__
from app.db import session as db
from app.db.models import Artist as ArtistModel


@strawberry.type
class Health:
    status: str
    version: str
    database: str


@strawberry.type
class Artist:
    id: uuid.UUID
    display_name: str
    bio: str | None
    created_at: datetime

    @classmethod
    def from_model(cls, m: ArtistModel) -> "Artist":
        return cls(id=m.id, display_name=m.display_name, bio=m.bio, created_at=m.created_at)


@strawberry.type
class Query:
    @strawberry.field(description="Liveness of the API and its database connection.")
    async def health(self) -> Health:
        return Health(status="ok", version=__version__, database=await db.check_database())

    @strawberry.field(description="Newest artists first.")
    async def artists(self, limit: int = 20) -> list[Artist]:
        async for session in db.get_session():
            rows = await session.scalars(
                select(ArtistModel).order_by(ArtistModel.created_at.desc()).limit(min(limit, 100))
            )
            return [Artist.from_model(r) for r in rows]
        return []


schema = strawberry.Schema(query=Query)
