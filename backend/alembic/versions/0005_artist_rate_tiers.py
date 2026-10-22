"""artists.rate_tiers: commission options an artist sets themselves

Revision ID: 0005
Revises: 0004
Create Date: 2026-10-22
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("artists", sa.Column("rate_tiers", postgresql.JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column("artists", "rate_tiers")
