import uuid
from datetime import datetime
from enum import Enum

import strawberry
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app import __version__
from app.db import session as db
from app.db.models import Artist as ArtistModel
from app.graphql.viewer import ViewerMutation, ViewerQuery


@strawberry.type
class Health:
    status: str
    version: str
    database: str


@strawberry.enum
class Availability(Enum):
    OPEN = "Open"
    WAITLIST = "Waitlist"
    CLOSED = "Closed"


@strawberry.type
class Work:
    title: str
    material: str
    image_url: str | None


@strawberry.type
class Review:
    quote: str
    author: str


@strawberry.type
class Artist:
    id: uuid.UUID
    slug: str | None
    position: int
    display_name: str
    studio: str
    medium: str
    city: str
    price_min: int
    price_max: int
    commissions: int
    likes: int
    hue: int = strawberry.field(description="Hue for colour placeholders, 0–360.")
    chroma: float
    site: str
    reply_note: str
    tags: list[str]
    quote: str
    bio: str | None = strawberry.field(description="Paragraphs separated by a blank line.")
    availability: Availability
    cover_url: str | None
    portrait_url: str | None
    process_url: str | None
    process_video_url: str | None
    cover_video_url: str | None
    created_at: datetime
    works: list[Work]
    reviews: list[Review]

    @classmethod
    def from_model(cls, m: ArtistModel) -> "Artist":
        return cls(
            id=m.id,
            slug=m.slug,
            position=m.position,
            display_name=m.display_name,
            studio=m.studio,
            medium=m.medium,
            city=m.city,
            price_min=m.price_min,
            price_max=m.price_max,
            commissions=m.commissions,
            likes=m.likes,
            hue=m.hue,
            chroma=m.chroma,
            site=m.site,
            reply_note=m.reply_note,
            tags=list(m.tags or []),
            quote=m.quote,
            bio=m.bio,
            availability=Availability(m.availability),
            cover_url=m.cover_url,
            portrait_url=m.portrait_url,
            process_url=m.process_url,
            process_video_url=m.process_video_url,
            cover_video_url=m.cover_video_url,
            created_at=m.created_at,
            works=[
                Work(title=w.title, material=w.material, image_url=w.image_url) for w in m.works
            ],
            reviews=[Review(quote=r.quote, author=r.author) for r in m.reviews],
        )


def _with_children():
    return select(ArtistModel).options(
        selectinload(ArtistModel.works), selectinload(ArtistModel.reviews)
    )


@strawberry.type
class Query(ViewerQuery):
    @strawberry.field(description="Liveness of the API and its database connection.")
    async def health(self) -> Health:
        return Health(status="ok", version=__version__, database=await db.check_database())

    @strawberry.field(
        description="Studios in catalogue order (newest first after that), up to 200."
    )
    async def artists(self, limit: int = 20, medium: str | None = None) -> list[Artist]:
        query = _with_children().order_by(ArtistModel.position, ArtistModel.created_at.desc())
        if medium:
            query = query.where(ArtistModel.medium == medium)
        async for session in db.get_session():
            rows = await session.scalars(query.limit(max(1, min(limit, 200))))
            return [Artist.from_model(r) for r in rows]
        return []

    @strawberry.field(description='One studio by its URL slug, e.g. "maren".')
    async def artist(self, slug: str) -> Artist | None:
        async for session in db.get_session():
            row = await session.scalar(_with_children().where(ArtistModel.slug == slug))
            return Artist.from_model(row) if row else None
        return None


@strawberry.type
class Mutation(ViewerMutation):
    pass


schema = strawberry.Schema(query=Query, mutation=Mutation)
