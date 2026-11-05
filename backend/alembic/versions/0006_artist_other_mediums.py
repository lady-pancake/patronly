"""artists.other_mediums: further mediums an artist works in

Revision ID: 0006
Revises: 0005
Create Date: 2026-11-05
"""
from collections.abc import Sequence

from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE artists ADD COLUMN IF NOT EXISTS other_mediums TEXT[] NOT NULL DEFAULT '{}'"
    )


def downgrade() -> None:
    op.drop_column("artists", "other_mediums")
