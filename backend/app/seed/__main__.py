"""python -m app.seed: load the sample data into the database in DATABASE_URL.

Add --prune to also delete studios that are no longer in catalogue.json.
"""

import asyncio
import sys

from app.db import session as db
from app.seed import (
    load_catalogue,
    load_studio_template,
    prune_catalogue,
    seed_catalogue,
    seed_studio_template,
)


async def main(prune: bool = False) -> None:
    artists = load_catalogue()
    async for session in db.get_session():
        created, updated = await seed_catalogue(session, artists)
        print(f"Seeded {len(artists)} artists ({created} new, {updated} updated).")
        if prune:
            removed = await prune_catalogue(session, artists)
            names = ", ".join(removed) or "none"
            print(f"Removed {len(removed)} studios no longer in the file: {names}.")
        await seed_studio_template(session, load_studio_template())
        print("Seeded the studio builder's sample studio.")
    await db.dispose_engine()


if __name__ == "__main__":
    asyncio.run(main(prune="--prune" in sys.argv[1:]))
