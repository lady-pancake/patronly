"""artists.rate_tiers: commission options an artist sets themselves

Revision ID: 0005
Revises: 0004
Create Date: 2026-10-22
"""
from collections.abc import Sequence

from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # IF NOT EXISTS: the column was added by hand on the hosted database first.
    op.execute("ALTER TABLE artists ADD COLUMN IF NOT EXISTS rate_tiers JSONB")


def downgrade() -> None:
    op.drop_column("artists", "rate_tiers")
