"""python -m app.seed: load the sample studios into the database in DATABASE_URL."""

import asyncio

from app.db import session as db
from app.seed import load_catalogue, seed_catalogue


async def main() -> None:
    artists = load_catalogue()
    async for session in db.get_session():
        created, updated = await seed_catalogue(session, artists)
        print(f"Seeded {len(artists)} artists ({created} new, {updated} updated).")
    await db.dispose_engine()


if __name__ == "__main__":
    asyncio.run(main())
