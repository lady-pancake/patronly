from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter

from app import __version__
from app.config import get_settings
from app.db.session import check_database, dispose_engine
from app.graphql.schema import schema


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    await dispose_engine()


settings = get_settings()

app = FastAPI(title="Patronly API", version=__version__, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=settings.cors_origin_regex or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GraphiQL playground only outside production.
app.include_router(
    GraphQLRouter(schema, graphql_ide="graphiql" if settings.environment != "production" else None),
    prefix="/graphql",
)


@app.get("/health", tags=["ops"])
async def health() -> dict[str, str]:
    """Plain REST health check for uptime monitors."""
    return {"status": "ok", "version": __version__, "database": await check_database()}
