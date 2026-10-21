"""python -m app.seed: load the sample data into the database in DATABASE_URL."""

import asyncio

from app.db import session as db
from app.seed import load_catalogue, load_studio_template, seed_catalogue, seed_studio_template


async def main() -> None:
    artists = load_catalogue()
    async for session in db.get_session():
        created, updated = await seed_catalogue(session, artists)
        print(f"Seeded {len(artists)} artists ({created} new, {updated} updated).")
        await seed_studio_template(session, load_studio_template())
        print("Seeded the studio builder's sample studio.")
    await db.dispose_engine()


if __name__ == "__main__":
    asyncio.run(main())
