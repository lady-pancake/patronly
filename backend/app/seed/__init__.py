"""Loads the sample catalogue (catalogue.json) and the studio builder's sample
studio (studio_template.json) into the database.

The file is generated from the frontend's sample data with
`npm run export-catalogue`. Seeding is idempotent: artists are matched by slug,
updated in place, and their works and reviews replaced.
"""

import json
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Artist, Review, StudioTemplate, Work

CATALOGUE = Path(__file__).with_name("catalogue.json")
STUDIO_TEMPLATE = Path(__file__).with_name("studio_template.json")

# catalogue.json key -> Artist column
FIELDS = {
    "position": "position",
    "name": "display_name",
    "studio": "studio",
    "medium": "medium",
    "city": "city",
    "priceMin": "price_min",
    "priceMax": "price_max",
    "commissions": "commissions",
    "likes": "likes",
    "hue": "hue",
    "chroma": "chroma",
    "site": "site",
    "replyNote": "reply_note",
    "tags": "tags",
    "quote": "quote",
    "availability": "availability",
    "coverUrl": "cover_url",
    "portraitUrl": "portrait_url",
    "processUrl": "process_url",
    "processVideoUrl": "process_video_url",
    "coverVideoUrl": "cover_video_url",
}


def load_catalogue(path: Path = CATALOGUE) -> list[dict[str, Any]]:
    return json.loads(path.read_text(encoding="utf-8"))["artists"]


async def seed_catalogue(session: AsyncSession, artists: list[dict[str, Any]]) -> tuple[int, int]:
    """Upserts artists by slug. Returns (created, updated)."""
    existing = {
        a.slug: a
        for a in await session.scalars(
            select(Artist).where(Artist.slug.in_([a["slug"] for a in artists]))
        )
    }
    created = updated = 0
    for data in artists:
        artist = existing.get(data["slug"])
        if artist is None:
            artist = Artist(slug=data["slug"])
            session.add(artist)
            created += 1
        else:
            updated += 1
        for key, column in FIELDS.items():
            setattr(artist, column, data[key])
        artist.bio = "\n\n".join(data["bio"])
        await session.flush()
        # Replace works and reviews wholesale; the file is the source of truth.
        await session.refresh(artist, ["works", "reviews"])
        artist.works = [
            Work(position=i, title=w["title"], material=w["material"], image_url=w["imageUrl"])
            for i, w in enumerate(data["works"])
        ]
        artist.reviews = [
            Review(position=i, quote=r["quote"], author=r["author"])
            for i, r in enumerate(data["reviews"])
        ]
    await session.commit()
    return created, updated


def load_studio_template(path: Path = STUDIO_TEMPLATE) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


async def seed_studio_template(session: AsyncSession, template: dict[str, Any]) -> None:
    """Creates or replaces the sample studio the builder starts from."""
    values = {"draft": template["draft"], "account": template.get("account", {})}
    await session.execute(
        insert(StudioTemplate)
        .values(slug=template["slug"], **values)
        .on_conflict_do_update(index_elements=[StudioTemplate.slug], set_=values)
    )
    await session.commit()
