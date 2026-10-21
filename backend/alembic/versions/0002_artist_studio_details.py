"""artist studio details, works and reviews

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-21
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Every new column has a default, so rows created before this migration stay valid.
ARTIST_COLUMNS = [
    sa.Column("slug", sa.String(80), nullable=True),
    sa.Column("position", sa.Integer(), server_default="0", nullable=False),
    sa.Column("studio", sa.String(160), server_default="", nullable=False),
    sa.Column("medium", sa.String(60), server_default="", nullable=False),
    sa.Column("city", sa.String(120), server_default="", nullable=False),
    sa.Column("price_min", sa.Integer(), server_default="0", nullable=False),
    sa.Column("price_max", sa.Integer(), server_default="0", nullable=False),
    sa.Column("commissions", sa.Integer(), server_default="0", nullable=False),
    sa.Column("likes", sa.Integer(), server_default="0", nullable=False),
    sa.Column("hue", sa.Integer(), server_default="60", nullable=False),
    sa.Column("chroma", sa.Float(), server_default="0.08", nullable=False),
    sa.Column("site", sa.String(200), server_default="", nullable=False),
    sa.Column("reply_note", sa.String(200), server_default="", nullable=False),
    sa.Column("tags", postgresql.ARRAY(sa.Text()), server_default="{}", nullable=False),
    sa.Column("quote", sa.Text(), server_default="", nullable=False),
    sa.Column("availability", sa.String(10), server_default="Open", nullable=False),
    sa.Column("cover_url", sa.Text(), nullable=True),
    sa.Column("portrait_url", sa.Text(), nullable=True),
    sa.Column("process_url", sa.Text(), nullable=True),
    sa.Column("process_video_url", sa.Text(), nullable=True),
    sa.Column("cover_video_url", sa.Text(), nullable=True),
]


def upgrade() -> None:
    for column in ARTIST_COLUMNS:
        op.add_column("artists", column)
    op.create_unique_constraint("artists_slug_key", "artists", ["slug"])
    op.create_index("ix_artists_medium", "artists", ["medium"])
    op.create_check_constraint(
        "artists_availability_check", "artists", "availability in ('Open', 'Waitlist', 'Closed')"
    )

    op.create_table(
        "works",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "artist_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("artists.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("material", sa.String(200), server_default="", nullable=False),
        sa.Column("image_url", sa.Text(), nullable=True),
    )
    op.create_index("ix_works_artist_id", "works", ["artist_id"])

    op.create_table(
        "reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "artist_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("artists.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("quote", sa.Text(), nullable=False),
        sa.Column("author", sa.String(200), nullable=False),
    )
    op.create_index("ix_reviews_artist_id", "reviews", ["artist_id"])

    # Same as artists: private to the backend until row level security policies exist.
    op.execute("alter table works enable row level security")
    op.execute("alter table reviews enable row level security")


def downgrade() -> None:
    op.drop_table("reviews")
    op.drop_table("works")
    op.drop_constraint("artists_availability_check", "artists", type_="check")
    op.drop_index("ix_artists_medium", table_name="artists")
    op.drop_constraint("artists_slug_key", "artists", type_="unique")
    for column in reversed(ARTIST_COLUMNS):
        op.drop_column("artists", column.name)
